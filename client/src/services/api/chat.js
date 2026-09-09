import api from "./client";

/**
 * @typedef {Object} ChatTurn
 * @property {"user"|"assistant"} role - Who spoke.
 * @property {string} content - What they said.
 */

/**
 * @typedef {Object} ChatAnswer
 * @property {string} reply - The assistant's answer. Questions outside its
 *   reference document come back as the exact string "Out of reference."
 * @property {string[]} followUps - Exactly two suggested next questions, both
 *   answerable from that same document. The count is guaranteed server-side.
 */

/**
 * Ask the portfolio assistant a question (public — no auth required).
 *
 * The server is stateless, so earlier turns are replayed as `history`; it trims
 * them to the most recent few and silently drops anything malformed, which is
 * why the caller does not need to sanitize beyond dropping its own UI-only rows.
 * @param {Object} params
 * @param {string} params.message - The question. The server caps this at 500 characters.
 * @param {ChatTurn[]} [params.history] - Earlier turns, oldest first.
 * @returns {Promise<ChatAnswer>} The answer and its two follow-up questions.
 * @throws {Error} On 400 (bad payload), 429 (rate limited), or 503 (unavailable).
 */
export const sendChatMessage = async ({ message, history = [] }) => {
  const res = await api.post("/chat", { message, history });
  return res.data.data;
};
