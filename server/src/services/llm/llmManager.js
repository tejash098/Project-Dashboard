import config from "../../config/env.js";
import { FAILURE, generateWithGemini } from "./geminiService.js";
import {
  DEFAULT_FOLLOW_UPS,
  OUT_OF_REFERENCE_REPLY,
  SYSTEM_PROMPT,
} from "./systemPrompt.js";

/**
 * Allow a few stray leading words before the canonical refusal, so replies like
 * "Sorry, out of reference." still normalize. Bounded at four words so a real
 * answer that happens to mention the phrase later is not swallowed.
 */
/**
 * Below this much remaining time an attempt is not worth starting: it would
 * almost certainly abort mid-flight and spend a model's daily quota for nothing.
 */
const MIN_ATTEMPT_BUDGET_MS = 2_000;

const OUT_OF_REFERENCE_PATTERN = /^(?:\w+\s+){0,4}out of reference/;

/**
 * Reduce the client's replayed turns to something Gemini will accept.
 *
 * Order matters here: the history is truncated first, then any leading model
 * turn is dropped (Gemini rejects a conversation that opens with one), and only
 * then is the new question appended. Consecutive same-role turns are merged
 * last, so a history ending mid-question folds into the new one rather than
 * producing two user turns in a row.
 * @param {unknown} history - Replayed turns from the client; trusted for nothing.
 * @param {string} message - The new question.
 * @returns {Array<{ role: "user"|"assistant", content: string }>} Turns starting
 *   with a user turn and alternating thereafter.
 */
const normalizeMessages = (history, message) => {
  const sanitized = (Array.isArray(history) ? history : [])
    .filter(
      (turn) =>
        turn &&
        typeof turn === "object" &&
        (turn.role === "user" || turn.role === "assistant") &&
        typeof turn.content === "string" &&
        turn.content.trim(),
    )
    .map((turn) => ({
      role: turn.role,
      content: turn.content.trim().slice(0, config.chatMaxHistoryChars),
    }));

  // Keep the most recent turns only — an unbounded history is an unbounded bill.
  const recent = sanitized.slice(-(config.chatMaxHistoryTurns * 2));

  // Drop leading assistant turns exposed by that truncation.
  while (recent.length && recent[0].role === "assistant") recent.shift();

  const turns = [...recent, { role: "user", content: message }];

  return turns.reduce((merged, turn) => {
    const previous = merged.at(-1);
    if (previous?.role === turn.role) {
      previous.content = `${previous.content}\n${turn.content}`;
      return merged;
    }
    merged.push({ ...turn });
    return merged;
  }, []);
};

/**
 * Enforce the two guarantees the API contract makes, which the model cannot be
 * trusted to keep on its own: the refusal is always the exact canonical string,
 * and there are always exactly `chatFollowUpCount` follow-up questions.
 * @param {{ reply: string, followUps: string[] }} result - Raw model output.
 * @returns {{ reply: string, followUps: string[] }} The normalized answer.
 */
const normalizeResult = ({ reply, followUps }) => {
  // Strip case and punctuation before matching, so "Out of reference!" and
  // "out of reference" both collapse to the canonical constant.
  const flattened = reply
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const isRefusal = OUT_OF_REFERENCE_PATTERN.test(flattened);
  if (isRefusal && reply !== OUT_OF_REFERENCE_REPLY) {
    console.log("[chat] out-of-reference reply normalized");
  }

  const questions = followUps
    .filter((question) => typeof question === "string" && question.trim())
    .map((question) => question.trim())
    .slice(0, config.chatFollowUpCount);

  // Pad from the fallbacks rather than returning a short array — the contract
  // promises a fixed count, and the widget will render these as pills.
  for (const fallback of DEFAULT_FOLLOW_UPS) {
    if (questions.length >= config.chatFollowUpCount) break;
    if (!questions.includes(fallback)) questions.push(fallback);
  }

  return {
    reply: isRefusal ? OUT_OF_REFERENCE_REPLY : reply,
    followUps: questions,
  };
};

/**
 * Answer one question, walking the configured Gemini models in order.
 *
 * The cascade is a quota strategy first and a resilience one second: on the free
 * tier each model has its own per-minute and per-day allowance, so falling
 * through to the next model buys a fresh budget rather than retrying an
 * exhausted one. It also absorbs the 503 "high demand" a busy model returns.
 *
 * Owns the request's time budget — this is the only place in the server that
 * sets a timeout on outbound work. Each attempt gets at most
 * chatAttemptTimeoutMs, and the walk stops once chatTotalTimeoutMs is spent.
 * @param {Object} params
 * @param {string} params.message - The visitor's question, already validated.
 * @param {unknown} [params.history] - Replayed turns; sanitized here.
 * @returns {Promise<{ reply: string, followUps: string[] }>}
 * @throws {Error & { code: "no-keys"|"all-failed"|"request-invalid" }}
 */
export const generateReply = async ({ message, history }) => {
  // Read per call rather than at module load, so tests can vary these between
  // cases the way captureScreenshot.test.js varies microlinkApiKey.
  const apiKey = config.geminiApiKey;
  const models = config.geminiModels;

  if (!apiKey) {
    const error = new Error("No Gemini API key is configured");
    error.code = "no-keys";
    throw error;
  }

  const messages = normalizeMessages(history, message);
  const startedAt = Date.now();
  const deadline = startedAt + config.chatTotalTimeoutMs;

  for (const [index, model] of models.entries()) {
    const label = `${model} (${index + 1}/${models.length})`;
    const budget = Math.min(config.chatAttemptTimeoutMs, deadline - Date.now());

    if (budget < MIN_ATTEMPT_BUDGET_MS) {
      console.warn("[chat] time budget exhausted — stopping the model cascade");
      break;
    }

    try {
      const result = await generateWithGemini({
        apiKey,
        model,
        system: SYSTEM_PROMPT,
        messages,
        signal: AbortSignal.timeout(budget),
      });

      console.log(`[chat] answered by ${label} in ${Date.now() - startedAt}ms`);
      return normalizeResult(result);
    } catch (error) {
      // A malformed payload is our bug, not the vendor's, and fails identically
      // on every model. The controller turns this into a 400.
      if (error.kind === FAILURE.REQUEST_INVALID) {
        const invalid = new Error(error.message);
        invalid.code = "request-invalid";
        throw invalid;
      }

      // One key serves every model, so a rejected key leaves nothing to try.
      // Stopping here saves a pointless call per remaining model.
      if (error.kind === FAILURE.KEY_INVALID) {
        const badKey = new Error(error.message);
        badKey.code = "all-failed";
        throw badKey;
      }

      // Out of quota, overloaded, retired, or too slow — the next model has its
      // own allowance. Logged per model so the cause stays diagnosable.
      console.warn(
        `[chat] ${label} unavailable (${error.status ?? "no status"}): ${error.message}`,
      );
    }
  }

  const failed = new Error(
    `All ${models.length} configured Gemini model(s) failed`,
  );
  failed.code = "all-failed";
  throw failed;
};
