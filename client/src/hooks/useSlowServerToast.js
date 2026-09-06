import { useEffect } from "react";

/**
 * Stable id shared by every stage of the advisory, so escalating from the hint
 * to the full explanation — and finally to the sign-off — updates one toast in
 * place instead of stacking three on top of each other.
 */
const SLOW_TOAST_KEY = "api-slow";

/** 7s in: say nothing about why yet, just prove the app is still working. */
const STILL_LOADING_MESSAGE = "Still loading — hang tight.";

/** 20s in: past this point the wait needs a reason, not more reassurance. */
const WAKING_MESSAGE = "Waking the server…";

/**
 * The reason, held to one sentence — it sits under the message in the toast's
 * narrow panel, and anyone still reading it has already been waiting 20 seconds.
 */
const WAKING_DETAIL =
  "Running on a free instance that spins down when idle. The first request can take up to a minute.";

/** Closes the loop, so a long wait ends with something rather than a blank gap. */
const SERVER_AWAKE_MESSAGE = "Server's awake — thanks for waiting.";

/** Fallback copy if the interceptor sends no message with `api:unreachable`. */
const UNREACHABLE_MESSAGE = "Couldn't reach the server. Please try again.";

/**
 * Turn the slow-request events broadcast by the axios interceptors into a single
 * escalating toast, so a cold start is explained instead of looking like a hang.
 *
 * The dispatchers are passed in rather than pulled from `useToast()` because
 * this runs inside ToastProvider itself, which cannot consume the context it is
 * in the middle of supplying.
 *
 * @param {(toast: Object) => string} addToast - Queue or update a toast.
 * @param {(id: string) => void} dismissToast - Remove a toast by id.
 * @returns {void}
 */
export const useSlowServerToast = (addToast, dismissToast) => {
  useEffect(() => {
    /** Show, or escalate to, the waiting toast. */
    const onSlow = (e) => {
      const { stage, since } = e.detail ?? {};

      if (stage === "cold-start") {
        addToast({
          key: SLOW_TOAST_KEY,
          type: "loading",
          message: WAKING_MESSAGE,
          detail: WAKING_DETAIL,
          // Drives the ticking counter — visible evidence of progress, which a
          // static message can't give during a 50-second wait.
          since,
          duration: null,
        });
        return;
      }

      addToast({
        key: SLOW_TOAST_KEY,
        type: "loading",
        message: STILL_LOADING_MESSAGE,
        duration: null,
      });
    };

    /** Clear the waiting toast once traffic drains. */
    const onResolved = (e) => {
      // Only a wait long enough to have been explained earns a sign-off. A load
      // that crossed 7s and finished at 9s should just clear quietly — thanking
      // someone for a two-second wait is noise.
      if (e.detail?.stage !== "cold-start") {
        dismissToast(SLOW_TOAST_KEY);
        return;
      }

      // Same key, so this replaces the waiting toast in place and then
      // auto-dismisses on the default TTL.
      addToast({
        key: SLOW_TOAST_KEY,
        type: "success",
        message: SERVER_AWAKE_MESSAGE,
      });
    };

    /** Swap the waiting toast for a failure when the server never answers. */
    const onUnreachable = (e) => {
      // Drop the waiting toast first — leaving "Waking the server…" on screen
      // beside a failure message reads as contradictory.
      dismissToast(SLOW_TOAST_KEY);
      addToast({
        type: "error",
        message: e.detail?.message || UNREACHABLE_MESSAGE,
      });
    };

    window.addEventListener("api:slow", onSlow);
    window.addEventListener("api:slow-resolved", onResolved);
    window.addEventListener("api:unreachable", onUnreachable);
    return () => {
      window.removeEventListener("api:slow", onSlow);
      window.removeEventListener("api:slow-resolved", onResolved);
      window.removeEventListener("api:unreachable", onUnreachable);
    };
  }, [addToast, dismissToast]);
};
