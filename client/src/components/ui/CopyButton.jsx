import { useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { useToast } from "../../hooks/useToast";
import { A11Y, ICON_SIZE, ROUNDED } from "../../config/constants";

/**
 * Small icon button that copies `value` to the clipboard and confirms via a
 * toast. Briefly swaps to a check icon as inline visual feedback.
 *
 * @param {Object} props
 * @param {string} props.value   - Text to copy.
 * @param {string} [props.label] - Accessible label / tooltip (e.g. "Copy email").
 */
const CopyButton = ({ value, label = "Copy" }) => {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  /** Copy `value` to the clipboard, confirm with a toast, and flash a check. */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      addToast({ type: "success", message: "Copied to clipboard" });
    } catch {
      // Clipboard can be blocked (insecure context or denied permission).
      addToast({ type: "error", message: "Couldn’t copy to clipboard" });
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center p-1 ${ROUNDED.SM}
        text-text-secondary hover:text-accent hover:bg-accent-subtle
        ${A11Y.FOCUS_RING}`}
    >
      {copied ? (
        <CheckIcon sx={{ fontSize: ICON_SIZE.SM }} />
      ) : (
        <ContentCopyIcon sx={{ fontSize: ICON_SIZE.SM }} />
      )}
    </button>
  );
};

export default CopyButton;
