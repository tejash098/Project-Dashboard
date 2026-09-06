import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import ToastProvider from "../context/ToastProvider.jsx";

/** Mirrors TOAST_TTL in ToastProvider — how long a normal toast lives. */
const TOAST_TTL = 3500;

/**
 * Fire one of the CustomEvents the axios interceptors broadcast. Wrapped in
 * `act` because the listener sets state synchronously.
 *
 * @param {string} type - Event name, e.g. "api:slow".
 * @param {Object} [detail] - Event detail payload.
 */
const emit = (type, detail) => {
  act(() => {
    window.dispatchEvent(new CustomEvent(type, { detail }));
  });
};

/** Advance fake timers inside `act` so React flushes the resulting renders. */
const advance = (ms) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

/**
 * The cold-start advisory is the one toast in the app that changes while it is
 * on screen: it appears as a hint, escalates to an explanation, and is replaced
 * by a sign-off. Each of those transitions has a way to look broken — stacking a
 * second toast, auto-dismissing mid-wait, or leaving a stale one behind — and
 * none of it is visible from the monitor's unit tests, which only check timings.
 */
describe("ToastProvider — cold-start advisory", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <div />
      </ToastProvider>,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a single hint toast when a request first goes slow", () => {
    emit("api:slow", { stage: "hint", since: Date.now() });

    expect(screen.getByRole("status")).toHaveTextContent("Still loading");
  });

  it("escalates in place rather than stacking a second toast", () => {
    const since = Date.now();
    emit("api:slow", { stage: "hint", since });
    emit("api:slow", { stage: "cold-start", since });

    // One slot, not two — both stages share a key, so the second call replaces
    // the first instead of appending under it.
    const toasts = screen.getAllByRole("status");
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toHaveTextContent("Waking the server");
    // The explanation is the whole point of the second stage.
    expect(toasts[0]).toHaveTextContent("free instance that spins down");
  });

  it("keeps the waiting toast on screen past the normal auto-dismiss", () => {
    emit("api:slow", { stage: "cold-start", since: Date.now() });
    advance(TOAST_TTL * 3);

    // `duration: null` — a toast that vanished mid-cold-start would leave the
    // visitor back where they started, staring at a silent "Loading…".
    expect(screen.getByRole("status")).toHaveTextContent("Waking the server");
  });

  it("ticks the elapsed counter while the wait continues", () => {
    emit("api:slow", { stage: "cold-start", since: Date.now() - 20_000 });

    // Seeded from the real elapsed time, not zero: the counter appears 20s into
    // the wait and would understate it by restarting the clock.
    expect(screen.getByRole("status")).toHaveTextContent("(20s)");

    advance(3000);
    expect(screen.getByRole("status")).toHaveTextContent("(23s)");
  });

  it("hides the counter from assistive tech so it isn't re-announced", () => {
    emit("api:slow", { stage: "cold-start", since: Date.now() });

    // Each toast is a role=status live region. An exposed per-second counter
    // would make a screen reader repeat the toast for the whole cold start.
    // Matched by its text rather than the attribute, so the spinner — which
    // lucide already marks aria-hidden — can't satisfy this by accident.
    expect(screen.getByText(/\(\d+s\)/)).toHaveAttribute("aria-hidden", "true");
  });

  it("swaps to a sign-off that then dismisses itself", () => {
    emit("api:slow", { stage: "cold-start", since: Date.now() });
    emit("api:slow-resolved", { stage: "cold-start" });

    const toasts = screen.getAllByRole("status");
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toHaveTextContent("Server's awake");

    // Reusing the key must not inherit the waiting toast's pinned-open state.
    advance(TOAST_TTL + 100);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("clears a hint-only wait quietly, with no sign-off", () => {
    emit("api:slow", { stage: "hint", since: Date.now() });
    emit("api:slow-resolved", { stage: "hint" });

    // Thanking someone for a nine-second wait they were barely told about is
    // noise, so this stage just disappears.
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("replaces the waiting toast with an error when the server never answers", () => {
    emit("api:slow", { stage: "cold-start", since: Date.now() });
    emit("api:unreachable", { message: "Couldn't reach the server." });

    const toasts = screen.getAllByRole("status");
    // "Waking the server…" sitting beside a failure would read as contradictory.
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toHaveTextContent("Couldn't reach the server.");
  });

  it("still auto-dismisses ordinary keyless toasts on the default TTL", () => {
    // Regression guard for the timer rework: the 18 existing call sites pass
    // neither a key nor a duration and must behave exactly as they always have.
    emit("api:rate-limited", { message: "Too many requests." });
    expect(screen.getByRole("status")).toHaveTextContent("Too many requests.");

    advance(TOAST_TTL + 100);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
