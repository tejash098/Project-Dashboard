import { ROUNDED, TYPOGRAPHY } from "../../config/constants";

/**
 * Per-method color presets for the badge. Following the near-universal API-docs
 * convention, the color signals the method's effect: accent (read), green
 * (create), amber (update), red (destructive).
 *
 * Class strings are written verbatim so Tailwind's scanner detects them —
 * utilities are never picked up from interpolated/constructed strings (same
 * reasoning as StatusBadge's STATUS_CONFIG).
 */
const METHOD_CONFIG = {
  GET: "bg-accent-subtle text-accent",
  POST: "bg-success-subtle text-success",
  PUT: "bg-warning-subtle text-warning",
  DELETE: "bg-danger-subtle text-danger",
};

/** Fallback styling for an unrecognized HTTP method. */
const FALLBACK = "bg-page-bg border border-border text-text-secondary";

/**
 * Small colored pill showing an HTTP method (GET, POST, PUT, DELETE).
 * Mirrors StatusBadge's lookup-object pattern; unknown methods fall back to a
 * neutral chip. The label is monospaced to match how methods read in docs.
 *
 * @param {"GET"|"POST"|"PUT"|"DELETE"|string} method - HTTP method to display.
 */
const MethodBadge = ({ method }) => {
  // Normalize so a lowercase value still maps to the right preset.
  const key = method?.toUpperCase();
  const className = METHOD_CONFIG[key] ?? FALLBACK;

  return (
    <span
      className={`inline-flex items-center ${ROUNDED.FULL} px-2.5 py-0.5
        font-mono ${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_SEMIBOLD} ${className}`}
    >
      {key}
    </span>
  );
};

export default MethodBadge;
