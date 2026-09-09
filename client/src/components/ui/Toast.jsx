import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { Loader2 } from "lucide-react";
import {
  ICON_SIZE,
  ROUNDED,
  TYPOGRAPHY,
  A11Y,
  Z_INDEX,
} from "../../config/constants";

/**
 * Icon and colour for each toast type. A keyed lookup rather than a boolean, so
 * adding a type stays additive and no branch is left rendering a blank slot.
 * `info` borrows the accent token used for links, reading as neutral guidance in
 * both themes instead of introducing a new colour; `loading` borrows the same
 * one, since a wait is guidance rather than an outcome.
 *
 * `iconProps` exists because the set is mixed: the MUI icons size through `sx`,
 * while lucide's spinner takes a plain `size` prop and would otherwise leak an
 * unknown `sx` attribute onto its <svg>.
 */
const TOAST_VARIANTS = {
  success: {
    Icon: CheckCircleIcon,
    className: "text-success",
    iconProps: { sx: { fontSize: ICON_SIZE.SM } },
  },
  error: {
    Icon: ErrorIcon,
    className: "text-danger",
    iconProps: { sx: { fontSize: ICON_SIZE.SM } },
  },
  info: {
    Icon: InfoOutlinedIcon,
    className: "text-accent",
    iconProps: { sx: { fontSize: ICON_SIZE.SM } },
  },
  loading: {
    Icon: Loader2,
    className: "text-accent animate-spin motion-reduce:animate-none",
    iconProps: { size: ICON_SIZE.SM },
  },
};

/**
 * Ticking "(23s)" counter for a toast that is waiting on something.
 *
 * Owns its own interval so the once-a-second re-render stays on this leaf rather
 * than re-rendering the whole toast stack. Hidden from assistive tech on
 * purpose: each toast is a `role="status"` live region, so a visible ticking
 * number would make a screen reader re-announce the toast every second for the
 * length of a cold start. `aria-atomic` defaults to false, so hiding the one
 * changing node leaves the initial message as the only announcement.
 *
 * @param {Object} props
 * @param {number} props.since - Epoch ms the wait started at.
 */
const ElapsedSeconds = ({ since }) => {
  // Seed from the real elapsed time, not zero: the counter appears 20s into the
  // wait and should say so rather than restarting the clock.
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, Math.round((Date.now() - since) / 1000)),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(Math.max(0, Math.round((Date.now() - since) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [since]);

  return (
    <span aria-hidden="true" className="text-text-secondary tabular-nums">
      {` (${seconds}s)`}
    </span>
  );
};

/**
 * Toast stack — fixed to the bottom-right corner, rendered via a portal so it
 * overlays the whole app regardless of where it's mounted. Presentational only:
 * the queue and timers live in ToastContext.
 *
 * @param {Object} props
 * @param {{ id: string, type: "success"|"error"|"info"|"loading", message: string,
 *   detail?: string, since?: number }[]} props.toasts - Active toasts.
 * @param {(id: string) => void} props.onDismiss - Remove a toast by id.
 */
const Toast = ({ toasts, onDismiss }) => {
  // Nothing to show — render nothing (avoids an empty fixed container).
  if (toasts.length === 0) return null;

  return createPortal(
    // Raised clear of the chat launcher, which shares this corner. bottom-4
    // would put the stack on top of it — and the cold-start toast is pinned
    // open (duration: null), so it would block the launcher for the whole wait.
    // Blocking the entrance is worse than briefly overlapping the panel.
    <div className={`fixed bottom-24 right-4 ${Z_INDEX.MODAL} flex flex-col gap-2`}>
      {toasts.map((toast) => {
        // Fall back to success so an unrecognised type still renders an icon.
        const { Icon, className, iconProps } =
          TOAST_VARIANTS[toast.type] ?? TOAST_VARIANTS.success;
        return (
          <div
            key={toast.id}
            role="status"
            // max-w-sm rather than xs: the cold-start toast carries an
            // explanatory second line that would otherwise run to six lines.
            className={`flex items-start gap-2 ${ROUNDED.MD} border border-border
              bg-surface px-4 py-3 shadow-lg max-w-sm ${A11Y.MOTION_SAFE}`}
          >
            {/* Status icon — green check, red error, accent info, or a spinner. */}
            <Icon {...iconProps} className={`${className} mt-0.5`} />

            <div className={`${TYPOGRAPHY.TEXT_SM} text-text-primary flex-1`}>
              <span>
                {toast.message}
                {/* Live elapsed time — only on toasts carrying a start stamp. */}
                {toast.since !== undefined && (
                  <ElapsedSeconds since={toast.since} />
                )}
              </span>

              {/* Optional second line, e.g. why the server is slow to answer. */}
              {toast.detail && (
                <p className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary mt-1`}>
                  {toast.detail}
                </p>
              )}
            </div>

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
