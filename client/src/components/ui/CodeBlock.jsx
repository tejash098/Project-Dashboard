import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useToast } from "../../hooks/useToast";
import { A11Y, BORDER, ICON_SIZE, ROUNDED, TYPOGRAPHY } from "../../config/constants";

/**
 * Reusable code / JSON display block. Objects are pretty-printed as JSON;
 * strings render as-is. Content sits in a recessed, bordered, monospace block
 * that scrolls horizontally instead of breaking the layout, and a Copy button
 * copies the rendered text (confirmed via a toast).
 *
 * <pre> preserves whitespace and line breaks (essential for formatted JSON);
 * <code> is the semantic tag for code — together they're the standard pairing.
 *
 * @param {Object|string} content     - Object (JSON-stringified) or raw string to display.
 * @param {string}        [className] - Extra classes for the outer wrapper.
 */
const CodeBlock = ({ content, className = "" }) => {
  const { addToast } = useToast();

  // Objects become pretty-printed JSON; strings are shown verbatim.
  const text =
    typeof content === "string" ? content : JSON.stringify(content, null, 2);

  /** Copy the rendered text to the clipboard and confirm with a toast. */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({ type: "success", message: "Copied to clipboard" });
    } catch {
      // Clipboard can be blocked (e.g. insecure context or denied permission).
      addToast({ type: "error", message: "Couldn’t copy to clipboard" });
    }
  };

  return (
    // `relative` anchors the absolutely-positioned copy button.
    <div className={`relative group ${className}`}>
      {/* ── Copy button — top-right, subtle until hover/focus ── */}
      <button
        type="button"
        onClick={handleCopy}
        title="Copy to clipboard"
        aria-label="Copy to clipboard"
        className={`absolute top-2 right-2 inline-flex items-center gap-1
          ${ROUNDED.SM} border ${BORDER.DEFAULT} bg-surface px-2 py-1
          ${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary
          opacity-0 group-hover:opacity-100 focus-visible:opacity-100
          hover:text-accent ${A11Y.FOCUS_RING}`}
      >
        <ContentCopyIcon sx={{ fontSize: ICON_SIZE.SM }} />
        Copy
      </button>

      {/* ── The code itself — monospace, recessed, horizontally scrollable ── */}
      <pre
        className={`bg-page-bg border ${BORDER.DEFAULT} ${ROUNDED.MD} p-4
          overflow-x-auto ${TYPOGRAPHY.TEXT_XS} text-text-primary`}
      >
        <code className="font-mono whitespace-pre">{text}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
