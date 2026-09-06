/**
 * Tracks how long the app has had API traffic in flight, so the UI can explain a
 * cold start rather than showing a silent "Loading…" for the better part of a
 * minute. The API runs on a free instance that spins down after ~15 minutes idle
 * and takes 30-60s to wake; nothing else in the app tells a visitor that this is
 * what they are waiting for, so a slow first load reads as a broken app.
 *
 * Framework-free by design: the axios interceptors that drive it run outside
 * React, so progress is broadcast as CustomEvents on `window` and picked up by
 * useSlowServerToast — the same bridge pattern as `api:rate-limited`.
 */

/** Soft nudge — proves the app isn't frozen, without explaining anything yet. */
const HINT_DELAY_MS = 7_000;

/** Full cold-start explanation, with a live elapsed counter. */
const COLD_START_DELAY_MS = 20_000;

/** Requests currently in flight. */
let pending = 0;

/**
 * Highest stage reached during the current run of continuous traffic:
 * "idle" until a timer fires, then "hint", then "cold-start" — never backwards.
 */
let stage = "idle";

/** Handles for the two escalations; null whenever nothing is scheduled. */
let hintTimer = null;
let coldStartTimer = null;

/** When the current run of continuous traffic began (epoch ms). */
let slowSince = 0;

/** Cancel both pending escalations. */
const clearTimers = () => {
  clearTimeout(hintTimer);
  clearTimeout(coldStartTimer);
  hintTimer = null;
  coldStartTimer = null;
};

/**
 * Announce a stage escalation.
 *
 * @param {"hint"|"cold-start"} next - Stage being entered.
 */
const emitSlow = (next) => {
  stage = next;
  console.warn(`[api] slow request → stage: ${next}`);
  window.dispatchEvent(
    new CustomEvent("api:slow", { detail: { stage: next, since: slowSince } }),
  );
};

/**
 * Record a request leaving the client. Call from the request interceptor.
 *
 * @returns {void}
 */
export const startRequest = () => {
  pending += 1;
  // Only the 0 -> 1 transition starts the clock. A page load fires several
  // requests at once and a cold start stalls all of them, so the wait is
  // measured from the first — re-anchoring on each new request would keep
  // pushing the deadline out and the toast would never appear.
  if (pending > 1) return;

  slowSince = Date.now();
  hintTimer = setTimeout(() => emitSlow("hint"), HINT_DELAY_MS);
  coldStartTimer = setTimeout(() => emitSlow("cold-start"), COLD_START_DELAY_MS);
};

/**
 * Record a request settling, successfully or not. Call from both branches of the
 * response interceptor — an error still ends the wait.
 *
 * @returns {void}
 */
export const endRequest = () => {
  // Floor at zero: an `endRequest` without a matching `startRequest` would
  // otherwise drive the counter negative and wedge the clock permanently off.
  pending = Math.max(0, pending - 1);
  if (pending > 0) return;

  clearTimers();

  // Nothing was ever announced — everything settled inside the hint window, so
  // stay silent rather than flashing a toast nobody had time to read.
  if (stage === "idle") return;

  const resolved = stage;
  stage = "idle";
  console.log(`[api] slow request resolved after ${Date.now() - slowSince}ms`);
  window.dispatchEvent(
    new CustomEvent("api:slow-resolved", {
      // The highest stage reached, so the toast knows whether the wait was long
      // enough to have been explained — and therefore worth signing off.
      detail: { stage: resolved, durationMs: Date.now() - slowSince },
    }),
  );
};

/**
 * Clear all module state. Exists for tests, which share this module across cases
 * and would otherwise leak a pending count or a live timer between them.
 *
 * @returns {void}
 */
export const resetSlowRequestMonitor = () => {
  clearTimers();
  pending = 0;
  stage = "idle";
  slowSince = 0;
};
