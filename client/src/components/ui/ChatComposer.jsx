import { useState } from "react";
import SendIcon from "@mui/icons-material/Send";
import {
  A11Y,
  CHAT,
  ICON_SIZE,
  ROUNDED,
  TYPOGRAPHY,
  WIDTH,
} from "../../config/constants";

/** Textarea styling — static for the Tailwind scanner, as in FeedbackWidget. */
const TEXTAREA_CLASS = `${WIDTH.FULL} ${ROUNDED.MD} border border-border bg-page-bg
  px-3 py-2 ${TYPOGRAPHY.TEXT_SM} text-text-primary
  placeholder:text-text-secondary ${A11Y.FOCUS_RING} resize-none`;

/**
 * The free-text input.
 *
 * Owns the draft string so a keystroke re-renders only this leaf rather than
 * the whole transcript above it — the same reasoning behind Toast's
 * ElapsedSeconds owning its own interval.
 *
 * @param {Object} props
 * @param {boolean} props.pending - True while a reply is in flight.
 * @param {(text: string) => void} props.onSend - Called with the trimmed question.
 */
const ChatComposer = ({ pending, onSend }) => {
  const [draft, setDraft] = useState("");

  /** Send the draft and clear it, ignoring an empty or mid-flight submit. */
  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed || pending) return;
    setDraft("");
    onSend(trimmed);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  /**
   * Enter sends, Shift+Enter inserts a newline. `isComposing` guards an IME
   * candidate window, where Enter commits the candidate and must not also send
   * a half-finished message.
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const remaining = CHAT.MAX_MESSAGE_CHARS - draft.length;

  return (
    <form onSubmit={handleSubmit} className="border-t border-border p-3">
      <label htmlFor="chat-input" className="sr-only">
        Ask a question about Tejash or this dashboard
      </label>

      <div className="flex items-end gap-2">
        <textarea
          id="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          maxLength={CHAT.MAX_MESSAGE_CHARS}
          autoFocus
          placeholder="Ask a question…"
          className={TEXTAREA_CLASS}
        />

        <button
          type="submit"
          disabled={!draft.trim() || pending}
          aria-label="Send message"
          className={`shrink-0 ${ROUNDED.MD} bg-accent px-3 py-2 text-white
            hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed
            ${A11Y.FOCUS_RING}`}
        >
          <SendIcon sx={{ fontSize: ICON_SIZE.SM }} />
        </button>
      </div>

      {/* Counter appears only near the cap; aria-hidden because a number that
          changes per keystroke inside reach of a live region would chatter.
          maxLength is the real enforcement, and typing simply stopping is
          perceivable without narration. */}
      {remaining <= CHAT.COUNTER_THRESHOLD && (
        <p
          aria-hidden="true"
          className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary mt-1 text-right tabular-nums`}
        >
          {remaining} characters left
        </p>
      )}
    </form>
  );
};

export default ChatComposer;
