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
 * Answer one question with the configured Gemini key.
 *
 * Owns the request's time budget — this is the only place in the server that
 * sets a timeout on outbound work. It is also the seam a provider cascade would
 * slot into later: geminiService already classifies its failures finely enough
 * (see its FAILURE kinds) to drive key rotation or a fallback vendor, even
 * though a single key only needs two outcomes today.
 * @param {Object} params
 * @param {string} params.message - The visitor's question, already validated.
 * @param {unknown} [params.history] - Replayed turns; sanitized here.
 * @returns {Promise<{ reply: string, followUps: string[] }>}
 * @throws {Error & { code: "no-keys"|"all-failed"|"request-invalid" }}
 */
export const generateReply = async ({ message, history }) => {
  // Read per call rather than at module load, so tests can vary it between
  // cases the way captureScreenshot.test.js varies microlinkApiKey.
  const apiKey = config.geminiApiKey;

  if (!apiKey) {
    const error = new Error("No Gemini API key is configured");
    error.code = "no-keys";
    throw error;
  }

  const messages = normalizeMessages(history, message);
  const startedAt = Date.now();

  try {
    const result = await generateWithGemini({
      apiKey,
      system: SYSTEM_PROMPT,
      messages,
      signal: AbortSignal.timeout(config.chatAttemptTimeoutMs),
    });

    console.log(`[chat] answered by gemini in ${Date.now() - startedAt}ms`);
    return normalizeResult(result);
  } catch (error) {
    // A malformed payload is our bug, not the vendor's, and the controller
    // turns it into a 400 rather than a "try again later".
    if (error.kind === FAILURE.REQUEST_INVALID) {
      const invalid = new Error(error.message);
      invalid.code = "request-invalid";
      throw invalid;
    }

    // Everything else — throttled, rejected key, vendor down, timeout — is the
    // same outcome for the visitor. The kind is logged so it stays diagnosable.
    console.warn(
      `[chat] gemini failed (${error.kind ?? "unknown"}, ${error.status ?? "no status"}): ${error.message}`,
    );
    const failed = new Error(error.message);
    failed.code = "all-failed";
    throw failed;
  }
};
