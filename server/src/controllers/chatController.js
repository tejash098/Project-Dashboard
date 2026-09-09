import config from "../config/env.js";
import { generateReply } from "../services/llm/llmManager.js";

/**
 * The one message a visitor sees when the assistant cannot answer at all.
 *
 * Both "no key is configured" and "every key failed" resolve to this. That is
 * deliberate: the first is operational detail about our deployment, and the
 * public has no business learning it from an error body.
 */
const UNAVAILABLE_MESSAGE =
  "The assistant is unavailable right now. Please try again in a moment.";

/**
 * Validate the chat request payload.
 *
 * Strict about the container's shape, lenient about the history's contents: a
 * stale or buggy client should degrade rather than hard-fail, so malformed
 * turns are dropped later in llmManager instead of rejected here.
 * @param {unknown} body - Parsed JSON request body.
 * @returns {{ message: string, history: unknown[] }} The usable payload.
 * @throws {Error & { status: 400 }} When the body cannot be used at all.
 */
const validateChatRequest = (body) => {
  const reject = (message) => Object.assign(new Error(message), { status: 400 });

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw reject("Invalid request body.");
  }

  const { message, history } = body;

  if (typeof message !== "string" || !message.trim()) {
    throw reject("A message is required.");
  }

  const trimmed = message.trim();
  if (trimmed.length > config.chatMaxMessageChars) {
    throw reject(
      `Message is too long (max ${config.chatMaxMessageChars} characters).`,
    );
  }

  if (history !== undefined && !Array.isArray(history)) {
    throw reject("History must be an array.");
  }

  return { message: trimmed, history: history ?? [] };
};

/**
 * POST /api/chat
 * Answer a visitor's question about Tejash or this dashboard, grounded in the
 * reference document served at GET /api/chatbot-context.md. Anything the
 * document does not cover comes back as the fixed "Out of reference." reply.
 * Every answer carries exactly two follow-up questions, each answerable from
 * that same document.
 *
 * Public and stateless — nothing is stored, so the client replays prior turns
 * as `history` and older turns are dropped server-side.
 * @param {import("express").Request} req - Express request; body is
 *   `{ message: string, history?: Array<{ role, content }> }`.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 200 `{ status, data: { reply, followUps } }`,
 *   400 `{ status, message }` on a bad payload, 503 `{ status, message }` when
 *   no provider could answer, or 500 `{ status, message }`.
 */
export const postChat = async (req, res) => {
  try {
    const { message, history } = validateChatRequest(req.body);

    // Shape only — never the question text, and never the reply. This endpoint
    // carries visitor-authored content, the same reason app.js's tracer keeps
    // bodies out of the log for the login route.
    console.log(
      `[chat] request: chars=${message.length} history=${history.length}`,
    );

    const { reply, followUps } = await generateReply({ message, history });
    res.status(200).json({ status: "success", data: { reply, followUps } });
  } catch (error) {
    if (error.status === 400) {
      console.warn(`[chat] rejected: ${error.message}`);
      return res.status(400).json({ status: "error", message: error.message });
    }

    // The provider refused our payload. The upstream wording can carry internal
    // detail, so the visitor gets a generic nudge instead.
    if (error.code === "request-invalid") {
      console.error(`[chat] provider rejected our payload: ${error.message}`);
      return res.status(400).json({
        status: "error",
        message: "That question could not be processed. Please rephrase it.",
      });
    }

    if (error.code === "no-keys" || error.code === "all-failed") {
      console.error(`[chat] unavailable (${error.code}): ${error.message}`);
      return res
        .status(503)
        .json({ status: "error", message: UNAVAILABLE_MESSAGE });
    }

    console.error("[chat] unexpected error:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
};
