import { useCallback, useRef, useState } from "react";
// Imported deep rather than through the services/api barrel so a test can mock
// this one small module without replacing every other resource module with it.
import { sendChatMessage } from "../services/api/chat";
import { CHAT_STARTERS } from "../data/chatStarters";
import { CHAT } from "../config/constants";

/**
 * @typedef {Object} ChatMessage
 * @property {string} id - Monotonic client id; a React key only, never sent.
 * @property {"user"|"assistant"|"error"} role - Who the line belongs to.
 * @property {string} content - The line's text, already trimmed.
 */

/**
 * Statuses whose server message is safe to show verbatim.
 *
 * Everything else falls back to generic copy — chatController returns the raw
 * `error.message` on an unexpected failure, which can carry internals that have
 * no business reaching a visitor's screen.
 */
const TRUSTED_STATUSES = new Set([400, 429, 503]);

const NETWORK_LINE = "Couldn't reach the server. Please try again.";
const FALLBACK_LINE = "Something went wrong. Please try again.";

/**
 * Reduce the transcript to the turns the API accepts.
 *
 * `error` rows are dropped: they are client-authored UI copy, not conversation,
 * and replaying one would teach the assistant to talk about our own failure
 * messages. The `id` is stripped so the payload matches the documented request
 * body exactly.
 * @param {ChatMessage[]} messages - The transcript so far.
 * @returns {Array<{ role: "user"|"assistant", content: string }>} Turns, oldest first.
 */
const toHistory = (messages) =>
  messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-CHAT.MAX_HISTORY_MESSAGES)
    .map(({ role, content }) => ({ role, content }));

/**
 * Turn a failed request into one readable transcript line.
 * @param {Error & { response?: { status: number, data?: { message?: string } } }} error
 * @returns {string} Text for an `error` message.
 */
const errorLineFor = (error) => {
  if (!error.response) return NETWORK_LINE;
  const { status, data } = error.response;
  return TRUSTED_STATUSES.has(status) ? data?.message || FALLBACK_LINE : FALLBACK_LINE;
};

/**
 * Conversation state for the floating assistant.
 *
 * Owns the whole exchange: the transcript, the pills under it, and the single
 * in-flight request. Nothing is persisted — the hook lives on ChatWidget inside
 * AppShell, which renders outside `<Routes>`, so the transcript survives
 * navigation and resets on reload. That is the intended lifetime.
 *
 * Raises no toasts. The axios interceptor already broadcasts `api:rate-limited`
 * and `api:unreachable`, which ToastProvider surfaces; a toast from here would
 * report the same failure twice.
 *
 * @returns {{
 *   messages: ChatMessage[],
 *   suggestions: string[],
 *   pending: boolean,
 *   send: (text: string) => Promise<void>,
 * }}
 */
export const useChat = () => {
  const [messages, setMessages] = useState(/** @type {ChatMessage[]} */ ([]));
  const [suggestions, setSuggestions] = useState(() => [...CHAT_STARTERS]);
  const [pending, setPending] = useState(false);

  // Monotonic key source, the same ref pattern ToastProvider uses.
  const nextId = useRef(0);
  // The real re-entry guard. `send` closes over `messages` to build history, so
  // it is recreated every render; two clicks inside one tick would both see a
  // stale `pending`. The state drives rendering, this decides.
  const pendingRef = useRef(false);

  const send = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || pendingRef.current) return;
      // The typed path is already capped by the textarea's maxLength; this
      // guards the pill path, whose labels are model-authored.
      if (trimmed.length > CHAT.MAX_MESSAGE_CHARS) return;

      // Snapshot before appending, so history is the conversation *before* this
      // question — and keep the pills to restore if the request fails.
      const history = toHistory(messages);
      const restore = suggestions;

      setMessages((prev) => [
        ...prev,
        { id: `msg-${nextId.current++}`, role: "user", content: trimmed },
      ]);
      // Stale the moment a new question is asked.
      setSuggestions([]);
      setPending(true);
      pendingRef.current = true;

      try {
        const { reply, followUps } = await sendChatMessage({ message: trimmed, history });
        setMessages((prev) => [
          ...prev,
          { id: `msg-${nextId.current++}`, role: "assistant", content: reply },
        ]);
        // The server guarantees exactly two, but a model-authored question over
        // the cap would 400 the moment it was clicked — so it never becomes one.
        setSuggestions(
          followUps.filter((question) => question.length <= CHAT.MAX_MESSAGE_CHARS),
        );
      } catch (error) {
        console.warn(`[useChat] send failed: ${error?.message}`);
        setMessages((prev) => [
          ...prev,
          { id: `msg-${nextId.current++}`, role: "error", content: errorLineFor(error) },
        ]);
        // A rate-limited click must not leave the visitor staring at a dead panel.
        setSuggestions(restore);
      } finally {
        setPending(false);
        pendingRef.current = false;
      }
    },
    [messages, suggestions],
  );

  return { messages, suggestions, pending, send };
};
