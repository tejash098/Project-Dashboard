import config from "../../config/env.js";
import { RESPONSE_SCHEMA } from "./systemPrompt.js";

/**
 * Why an attempt failed.
 *
 * With one key and one provider, RETRYABLE_KEY and PROVIDER_DOWN both end as
 * the same 503 — only REQUEST_INVALID is handled differently, because that one
 * is our bug and becomes a 400. The finer distinction is kept anyway: it is
 * what a second key or a fallback vendor would branch on, and classifying the
 * responses correctly is the part that is easy to get wrong later.
 */
export const FAILURE = Object.freeze({
  // One key serves every model, so a key problem cannot be routed around —
  // trying the next model would just spend another call proving it.
  KEY_INVALID: "key-invalid",
  // This model is out of quota, overloaded, retired, or slow. Another model has
  // its own separate allowance, so the cascade moves on.
  MODEL_UNAVAILABLE: "model-unavailable",
  // Our payload is malformed. Identical on every model, so stop.
  REQUEST_INVALID: "request-invalid",
});

/** Longest upstream message fragment echoed into an error, in characters. */
const MESSAGE_SNIPPET_MAX = 200;

/**
 * Build a tagged error, mirroring githubController's `err.status` /
 * `err.rateLimited` idiom rather than introducing an error class hierarchy.
 *
 * The message is assembled from the status and a short upstream fragment only —
 * never the request URL or headers — and the key is scrubbed defensively even
 * though Gemini does not echo it today.
 * @param {string} message - Human-readable summary.
 * @param {Object} meta
 * @param {string} meta.kind - One of {@link FAILURE}.
 * @param {number} [meta.status] - Upstream HTTP status, when there was one.
 * @param {string} [meta.apiKey] - Key to redact from the message, if present.
 * @returns {Error & { provider: string, status?: number, kind: string }}
 */
const providerError = (message, { kind, status, apiKey }) => {
  const safe = apiKey ? message.split(apiKey).join("***") : message;
  const err = new Error(safe);
  err.provider = "gemini";
  err.kind = kind;
  if (status !== undefined) err.status = status;
  return err;
};

/**
 * Parse JSON without throwing — error bodies are occasionally HTML, and the
 * model can in principle break its own schema.
 * @param {string} text - Candidate JSON.
 * @returns {any|null} Parsed value, or null when it is not JSON.
 */
const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/**
 * Decide what a non-2xx response means.
 *
 * The row that matters most is the one where the status code misleads: Gemini
 * reports an invalid API key as **400**, not 401. Without the API_KEY_INVALID
 * check a dead key would be reported to the visitor as a bad request — a 400
 * blaming their question for our configuration problem. A 404 is almost always
 * a wrong model id rather than a transient fault, so it gets its own log line.
 * @param {number} status - Upstream HTTP status.
 * @param {string} raw - Raw response body.
 * @returns {string} One of {@link FAILURE}.
 */
const classifyStatus = (status, raw, model) => {
  // Per-model quota: RPM, TPM or the daily RPD. The next model has its own.
  if (status === 429) return FAILURE.MODEL_UNAVAILABLE;

  if (status === 401 || status === 403) {
    console.error(`[chat] gemini rejected the key with ${status} — check its value`);
    return FAILURE.KEY_INVALID;
  }

  // Gemini's bad-key response is a 400 carrying an API_KEY_INVALID reason.
  if (status === 400 && /API_KEY_INVALID|API key not valid/i.test(raw)) {
    console.error("[chat] gemini reported an invalid key as 400 — check its value");
    return FAILURE.KEY_INVALID;
  }

  // Anything else in the 4xx band that means "your request is wrong" — our bug,
  // and the only class of failure the visitor sees as a 400.
  if (status === 400 || status === 413 || status === 422) {
    return FAILURE.REQUEST_INVALID;
  }

  // A retired or misspelled id. Worth a loud log — but the next model in the
  // cascade may well be fine, which is exactly how a deprecated id degrades
  // instead of taking the endpoint down.
  if (status === 404) {
    console.error(
      `[chat] gemini returned 404 for model "${model}" — retired or misspelled id`,
    );
  }
  return FAILURE.MODEL_UNAVAILABLE;
};

/**
 * Ask Gemini one question with one API key.
 *
 * Deliberately owns neither a timeout nor a retry, and never reads
 * `config.geminiApiKey` or the model list — llmManager hands it the key, the
 * model and the signal. That is what lets the manager walk a model cascade, and
 * what would let Claude or OpenAI drop in behind the same signature.
 * @param {Object} params
 * @param {string} params.apiKey - The API key to authenticate with.
 * @param {string} params.model - Which Gemini model to ask; llmManager picks it.
 * @param {string} params.system - Stable system-prompt prefix.
 * @param {Array<{ role: "user"|"assistant", content: string }>} params.messages
 *   Neutral turns, guaranteed by the caller to start with a user turn.
 * @param {AbortSignal} params.signal - Owned by llmManager; only forwarded here.
 * @returns {Promise<{ reply: string, followUps: string[] }>} The parsed answer.
 * @throws {Error & { provider: string, status?: number, kind: string }}
 */
export const generateWithGemini = async ({ apiKey, model, system, messages, signal }) => {
  const url = `${config.geminiApiBase}/models/${model}:generateContent`;

  // Gemini names the assistant role "model". Getting this wrong is the single
  // most common bug in this integration — it 400s on any multi-turn request.
  const contents = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  let res;
  let raw;
  try {
    res = await fetch(url, {
      method: "POST",
      // The key travels as a header, never as a `?key=` query parameter: a key
      // in a URL leaks into every log line and error message that carries it.
      headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: {
          temperature: config.chatTemperature,
          maxOutputTokens: config.chatMaxOutputTokens,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
      signal,
    });
    raw = await res.text();
  } catch (err) {
    // The signal firing (AbortError/TimeoutError) or a DNS/TLS/connect failure
    // (TypeError). None of these are key-specific, so another key cannot help.
    throw providerError(`Gemini request failed: ${err.name}`, {
      kind: FAILURE.MODEL_UNAVAILABLE,
      apiKey,
    });
  }

  if (!res.ok) {
    const body = parseJson(raw);
    const detail = String(body?.error?.message ?? raw).slice(0, MESSAGE_SNIPPET_MAX);
    throw providerError(`Gemini responded ${res.status}: ${detail}`, {
      kind: classifyStatus(res.status, raw, model),
      status: res.status,
      apiKey,
    });
  }

  const body = parseJson(raw);
  if (!body) {
    throw providerError("Gemini returned a non-JSON body", {
      kind: FAILURE.MODEL_UNAVAILABLE,
      status: res.status,
      apiKey,
    });
  }

  // A safety block arrives as a 200 with no candidates, so it has to be caught
  // here rather than by the status check above.
  if (body.promptFeedback?.blockReason) {
    throw providerError(
      `Gemini blocked the prompt (${body.promptFeedback.blockReason})`,
      { kind: FAILURE.MODEL_UNAVAILABLE, apiKey },
    );
  }

  const candidate = body.candidates?.[0];
  if (!candidate) {
    throw providerError("Gemini returned no candidates", {
      kind: FAILURE.MODEL_UNAVAILABLE,
      apiKey,
    });
  }

  // Anything but STOP means the JSON below is likely truncated or withheld —
  // MAX_TOKENS in particular means chatMaxOutputTokens needs raising.
  if (candidate.finishReason && candidate.finishReason !== "STOP") {
    throw providerError(`Gemini stopped early (${candidate.finishReason})`, {
      kind: FAILURE.MODEL_UNAVAILABLE,
      apiKey,
    });
  }

  const text = (candidate.content?.parts ?? [])
    .map((part) => part.text)
    .filter(Boolean)
    .join("");

  const payload = parseJson(text);
  if (!payload || typeof payload.reply !== "string") {
    throw providerError("Gemini returned a reply that did not match the schema", {
      kind: FAILURE.MODEL_UNAVAILABLE,
      apiKey,
    });
  }

  return {
    reply: payload.reply.trim(),
    followUps: Array.isArray(payload.followUps) ? payload.followUps : [],
  };
};
