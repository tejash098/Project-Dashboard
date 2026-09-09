/**
 * Opening copy and starter questions for the chat widget.
 *
 * These are labels only — there are deliberately no canned answers here. Every
 * pill goes to the API like a typed question would, so nothing in the client
 * duplicates `server/src/docs/chatbot-context.md` and the two npm projects
 * cannot drift apart.
 */

/** Opening line shown above the transcript while it is empty. */
export const CHAT_GREETING =
  "Hi! Ask me about Tejash or this dashboard. Pick a question below, or type your own.";

/**
 * Starter questions offered before the first exchange. After that, the pills
 * come from each response's `followUps`, which the server guarantees are
 * answerable from its reference document.
 *
 * Shortened from that document's own "Questions This Assistant Can Answer"
 * section — keep them in sync when it changes. Kept brief so two fit per row.
 * @type {readonly string[]}
 */
export const CHAT_STARTERS = Object.freeze([
  "What is Tejash's background?",
  "What technologies does he work with?",
  "Where has he worked?",
  "What did he study?",
  "What is this dashboard built with?",
  "How do I get in touch?",
]);
