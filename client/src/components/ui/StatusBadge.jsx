import { ROUNDED, TYPOGRAPHY } from "../../config/constants";

/**
 * Per-status label + color presets for the badge.
 * Class strings are written verbatim so Tailwind's scanner detects them
 * (utilities are never picked up from interpolated/constructed strings).
 */
const STATUS_CONFIG = {
  active: { label: "Active", className: "bg-accent-subtle text-accent" },
  completed: { label: "Completed", className: "bg-success-subtle text-success" },
};

/** Fallback styling for an unrecognized status value. */
const FALLBACK = "bg-page-bg border border-border text-text-secondary";

/**
 * Small reusable pill showing a project's status.
 * Active renders amber; completed renders green; unknown values fall back
 * to a neutral chip using the raw status as its label.
 *
 * @param {"active"|"completed"|string} status - Project status to display.
 */
const StatusBadge = ({ status }) => {
  // Look up the preset, or build a neutral fallback for unknown statuses.
  const { label, className } = STATUS_CONFIG[status] ?? {
    label: status,
    className: FALLBACK,
  };

  return (
    <span
      className={`inline-flex items-center ${ROUNDED.FULL} px-2.5 py-0.5
        ${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} ${className}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;