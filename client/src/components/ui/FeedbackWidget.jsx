import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import { useToast } from "../../hooks/useToast";
import { postFeedback } from "../../services/api/feedback";
import navItems from "../../config/navItems";
import {
  A11Y,
  ICON_SIZE,
  ROUNDED,
  TYPOGRAPHY,
  WIDTH,
  Z_INDEX,
} from "../../config/constants";

/** Dummy sender details — the widget collects only a message, not contact info. */
const DUMMY_NAME = "TEST";
const DUMMY_EMAIL = "test@mail.com";

/** Textarea styling — mirrors Contact's INPUT_CLASS (static for the Tailwind scanner). */
const TEXTAREA_CLASS = `${WIDTH.FULL} ${ROUNDED.MD} border border-border bg-page-bg
  px-3 py-2 ${TYPOGRAPHY.TEXT_SM} text-text-primary
  placeholder:text-text-secondary ${A11Y.FOCUS_RING} resize-none`;

/**
 * Resolve a human-readable page name from the current path, used to scope the
 * feedback title (e.g. "About feedback"). Reuses the sidebar `navItems` labels;
 * matches on the first path segment so dynamic routes (e.g. "/projects/:slug")
 * still resolve to their section. Unknown routes fall back to "Page".
 * @param {string} pathname - The current `location.pathname`.
 * @returns {string} The display name of the active page.
 */
const pageNameFromPath = (pathname) => {
  if (pathname === "/") return "Dashboard";
  const segment = `/${pathname.split("/")[1]}`;
  return navItems.find((n) => n.path === segment)?.label ?? "Page";
};

/**
 * Global "Give Feedback" widget — a vertical tab pinned to the right edge of
 * every page that toggles a compact, page-scoped feedback form. Submitting
 * persists the message through the public feedback API with a page-derived title
 * and dummy sender details (the widget intentionally collects only a message).
 *
 * Rendered once inside `AppShell`, so it appears on all routes. Uses
 * `position: fixed`, so its place in the tree affects only stacking, not layout.
 */
const FeedbackWidget = () => {
  const { addToast } = useToast();
  const { pathname } = useLocation();

  const [open, setOpen] = useState(false); // panel visibility
  const [message, setMessage] = useState(""); // textarea content
  const [submitting, setSubmitting] = useState(false); // request in flight

  // Close the panel on Escape (the × button is the pointer affordance).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  /**
   * Persist the feedback for the current page, then toast + reset on success.
   * Mirrors Contact's submit flow: build a multipart body and POST it.
   * @param {React.FormEvent} e - The form submit event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", `${pageNameFromPath(pathname)} feedback`);
      formData.append("status", "active");
      formData.append("name", DUMMY_NAME);
      formData.append("email", DUMMY_EMAIL);
      formData.append("message", trimmed);

      await postFeedback(formData);

      addToast({ type: "success", message: "Thanks for your feedback!" });
      setMessage("");
      setOpen(false);
    } catch (err) {
      console.warn(`[Feedback] submit failed: ${err?.message}`);
      addToast({ type: "error", message: "Couldn’t send feedback. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed right-0 top-1/2 -translate-y-1/2 ${Z_INDEX.DRAWER}
        hidden md:flex items-center`}
    >
      {/* ── Vertical pull-tab — always visible; toggles the panel ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Give feedback"
        className={`[writing-mode:vertical-rl] rotate-180 ${ROUNDED.SM} rounded-r-none
          border border-border bg-surface px-1.5 py-3
          ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary
          hover:bg-accent-subtle hover:text-accent ${A11Y.FOCUS_RING}`}
      >
        Give Feedback
      </button>

      {/* ── Slide-out form — anchored to the right, tab sits at its left ── */}
      {open && (
        <form
          onSubmit={handleSubmit}
          className={`w-72 max-w-[calc(100vw-3rem)] ${ROUNDED.LG} rounded-r-none
            border border-accent bg-surface p-4 shadow-lg`}
        >
          {/* Header — prompt on the left, close button on the right. */}
          <div className="flex items-start justify-between gap-2">
            <h2 className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}>
              How can we improve this page?
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close feedback form"
              className={`${ROUNDED.MD} p-0.5 text-text-secondary
                hover:bg-accent-subtle hover:text-accent ${A11Y.FOCUS_RING}`}
            >
              <CloseIcon sx={{ fontSize: ICON_SIZE.MD }} />
            </button>
          </div>

          {/* Message — the only field the visitor fills in. */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            autoFocus
            placeholder="Your feedback…"
            className={`${TEXTAREA_CLASS} mt-3`}
          />

          {/* Submit — disabled while empty or a request is in flight. */}
          <button
            type="submit"
            disabled={!message.trim() || submitting}
            className={`${WIDTH.FULL} mt-3 ${ROUNDED.MD} bg-accent px-3 py-2
              ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-white
              hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed
              ${A11Y.FOCUS_RING}`}
          >
            {submitting ? "Sending…" : "Submit feedback"}
          </button>
        </form>
      )}
    </div>
  );
};

export default FeedbackWidget;
