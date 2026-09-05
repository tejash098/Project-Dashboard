import { createPortal } from "react-dom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { ICON_SIZE, ROUNDED, TYPOGRAPHY, A11Y } from "../../config/constants";

/**
 * Icon and colour for each toast type. A keyed lookup rather than a boolean, so
 * adding a type stays additive and no branch is left rendering a blank slot.
 * `info` borrows the accent token used for links, reading as neutral guidance in
 * both themes instead of introducing a new colour.
 */
const TOAST_VARIANTS = {
  success: { Icon: CheckCircleIcon, className: "text-success" },
  error: { Icon: ErrorIcon, className: "text-red-500" },
  info: { Icon: InfoOutlinedIcon, className: "text-accent" },
};

/**
 * Toast stack — fixed to the bottom-right corner, rendered via a portal so it
 * overlays the whole app regardless of where it's mounted. Presentational only:
 * the queue and timers live in ToastContext.
 *
 * @param {Object} props
 * @param {{ id: number, type: "success"|"error"|"info", message: string }[]} props.toasts - Active toasts.
 * @param {(id: number) => void} props.onDismiss - Remove a toast by id.
 */
const Toast = ({ toasts, onDismiss }) => {
  // Nothing to show — render nothing (avoids an empty fixed container).
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        // Fall back to success so an unrecognised type still renders an icon.
        const { Icon, className } =
          TOAST_VARIANTS[toast.type] ?? TOAST_VARIANTS.success;
        return (
          <div
            key={toast.id}
            role="status"
            className={`flex items-start gap-2 ${ROUNDED.MD} border border-border
              bg-surface px-4 py-3 shadow-lg max-w-xs ${A11Y.MOTION_SAFE}`}
          >
            {/* Status icon — green check, red error, or accent info per type. */}
            <Icon sx={{ fontSize: ICON_SIZE.SM }} className={`${className} mt-0.5`} />

            <span className={`${TYPOGRAPHY.TEXT_SM} text-text-primary flex-1`}>
              {toast.message}
            </span>

            {/* Manual dismiss — toasts also auto-dismiss on a timer. */}
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className={`text-text-secondary hover:text-text-primary ${A11Y.FOCUS_RING} ${ROUNDED.SM}`}
            >
              <CloseIcon sx={{ fontSize: ICON_SIZE.SM }} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
};

export default Toast;
