import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { CHAT, ICON_SIZE, ROUNDED, TYPOGRAPHY } from "../../config/constants";

/**
 * Bubble styling per role. Keyed lookup with a fallback — the same idiom as
 * Toast's TOAST_VARIANTS and StatusBadge. Class strings are written verbatim so
 * Tailwind's scanner detects them (utilities are never picked up from
 * interpolated strings).
 *
 * `label` is rendered visually hidden, so speech output distinguishes speakers
 * that sighted users read from alignment and colour alone.
 */
const MESSAGE_VARIANTS = {
  user: {
    className: "ml-auto bg-accent-subtle text-text-primary",
    label: "You",
  },
  assistant: {
    // bg-page-bg is the recessed surface used inside cards — which is exactly
    // what a bubble inside the bg-surface panel is.
    className: "mr-auto bg-page-bg border border-border text-text-primary",
    label: "Assistant",
  },
  error: {
    className: "mr-auto bg-danger-subtle text-danger",
    label: "Assistant error",
  },
};

/** Unknown roles render as an assistant turn rather than vanishing. */
const FALLBACK = MESSAGE_VARIANTS.assistant;

/**
 * The conversation transcript.
 *
 * An append-only live region: `role="log"` is the correct role, and `polite`
 * means a reply never interrupts what the visitor is already hearing. The
 * pending bubble lives inside the same region so one announcement covers it —
 * a nested `role="status"` would double-announce.
 *
 * @param {Object} props
 * @param {import("../../hooks/useChat").ChatMessage[]} props.messages - Turns so far.
 * @param {boolean} props.pending - Whether a reply is in flight.
 * @param {string} props.greeting - Opening copy, shown while the transcript is empty.
 */
const ChatMessageList = ({ messages, pending, greeting }) => {
  const scrollRef = useRef(null);

  // Keep the newest turn in view. Scrolling the container rather than calling
  // scrollIntoView on a sentinel: jsdom does not implement scrollIntoView, so
  // every test touching the transcript would otherwise need a stub.
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, pending]);

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Conversation"
      className={`${CHAT.TRANSCRIPT} flex flex-col gap-2 px-3 py-2`}
    >
      {/* ── Opening copy — replaced by the transcript once it has content ── */}
      {messages.length === 0 && (
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>{greeting}</p>
      )}

      {messages.map((message) => {
        const variant = MESSAGE_VARIANTS[message.role] ?? FALLBACK;
        return (
          <div
            key={message.id}
            className={`${CHAT.BUBBLE} ${ROUNDED.MD} ${TYPOGRAPHY.TEXT_SM} ${variant.className}`}
          >
            <span className="sr-only">{variant.label}: </span>
            {message.content}
          </div>
        );
      })}

      {/* ── Pending — inside the live region, so the wait is announced once ── */}
      {pending && (
        <div
          className={`${CHAT.BUBBLE} ${ROUNDED.MD} ${TYPOGRAPHY.TEXT_SM}
            mr-auto bg-page-bg border border-border text-text-secondary
            flex items-center gap-2`}
        >
          <Loader2
            size={ICON_SIZE.SM}
            className="animate-spin motion-reduce:animate-none"
          />
          Thinking…
        </div>
      )}
    </div>
  );
};

export default ChatMessageList;
