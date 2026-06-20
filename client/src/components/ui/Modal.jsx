import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import CloseIcon from "@mui/icons-material/Close";
import {
  Z_INDEX,
  ROUNDED,
  SPACING,
  TYPOGRAPHY,
  FLEX,
  A11Y,
  ICON_SIZE,
} from "../../config/constants";

/**
 * Reusable modal dialog rendered via a portal to `document.body` so it escapes
 * the AppShell's overflow/stacking contexts. Provides a blurred, semi-opaque
 * backdrop, Esc-to-close, click-outside-to-close, and basic focus management
 * (focus the panel on open, restore the previously focused element on close).
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is visible.
 * @param {() => void} props.onClose - Called on Esc, backdrop click, or the close button.
 * @param {string} props.title - Accessible dialog title (also rendered as a heading).
 * @param {React.ReactNode} props.children - Modal body content.
 */
const Modal = ({ open, onClose, title, children }) => {
  const panelRef = useRef(null);
  // Remember what had focus before opening so we can restore it on close.
  const previouslyFocused = useRef(null);

  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Focus the panel on open; restore prior focus on close.
  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement;
      // Focus the first focusable control, falling back to the panel itself.
      const focusable = panelRef.current?.querySelector(
        "input, button, textarea, select, [tabindex]",
      );
      (focusable ?? panelRef.current)?.focus();
    } else {
      previouslyFocused.current?.focus?.();
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    // Backdrop — blurred + dimmed; clicking it closes the modal.
    <div
      className={`fixed inset-0 ${Z_INDEX.MODAL} ${FLEX.CENTER_JUSTIFY}
        bg-black/40 backdrop-blur-sm ${SPACING.P_6}`}
      onClick={onClose}
    >
      {/* Panel — stops propagation so inside clicks don't close the modal. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm ${ROUNDED.LG} border border-border
          bg-surface ${SPACING.P_6} shadow-xl ${A11Y.FOCUS_RING}`}
      >
        {/* Header — title + close button. */}
        <div className={`${FLEX.JUSTIFY_BETWEEN} flex items-start gap-4 mb-4`}>
          <h2
            className={`${TYPOGRAPHY.TEXT_2XL} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className={`p-1 ${ROUNDED.SM} text-text-secondary
              hover:bg-accent-subtle hover:text-accent ${A11Y.FOCUS_RING}`}
          >
            <CloseIcon sx={{ fontSize: ICON_SIZE.MD }} />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
