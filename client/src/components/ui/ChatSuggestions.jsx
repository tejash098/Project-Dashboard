import { A11Y, ROUNDED, TRANSITION, TYPOGRAPHY } from "../../config/constants";

/**
 * Clickable question pills.
 *
 * Rendered from two sources over a conversation's life — the static starters
 * before the first exchange, then each reply's `followUps` — and deliberately
 * knows about neither. Keeping it a pure controlled component is what makes
 * that swap invisible to the caller.
 *
 * Styling is FilterTabs' pill with the active branch dropped. These are real
 * buttons in natural tab order, not a roving-tabindex menu widget.
 *
 * @param {Object} props
 * @param {string[]} props.questions - Labels to offer; renders nothing when empty.
 * @param {boolean} props.disabled - True while a reply is in flight, so a second
 *   question cannot be queued on top of the first.
 * @param {(question: string) => void} props.onSelect - Called with the clicked label.
 */
const ChatSuggestions = ({ questions, disabled, onSelect }) => {
  if (!questions.length) return null;

  return (
    <div
      role="group"
      aria-label="Suggested questions"
      className="flex flex-wrap gap-2 px-3 pb-2"
    >
      {questions.map((question) => (
        <button
          key={question}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(question)}
          className={`px-3 py-1.5 ${ROUNDED.MD} border border-border
            ${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM}
            text-text-secondary hover:bg-accent-subtle hover:text-accent
            disabled:opacity-60 disabled:cursor-not-allowed
            ${TRANSITION.COLORS} ${A11Y.FOCUS_RING}`}
        >
          {question}
        </button>
      ))}
    </div>
  );
};

export default ChatSuggestions;
