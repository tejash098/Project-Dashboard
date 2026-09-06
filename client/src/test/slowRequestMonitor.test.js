import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  startRequest,
  endRequest,
  resetSlowRequestMonitor,
} from "../services/api/slowRequestMonitor.js";

/**
 * Pull the slow-request CustomEvents out of a dispatchEvent spy, so assertions
 * read as "what did the user's toast see" rather than poking at call indices.
 * Ignores anything else the app might broadcast on window.
 *
 * @param {import("vitest").MockInstance} spy - The dispatchEvent spy.
 * @returns {{ type: string, detail: Object }[]} Events in dispatch order.
 */
const slowEvents = (spy) =>
  spy.mock.calls
    .map(([event]) => event)
    .filter((event) => event.type.startsWith("api:slow"))
    .map((event) => ({ type: event.type, detail: event.detail }));

/**
 * The monitor is what decides whether a visitor is told the server is waking up.
 * Its whole job is timing, and the timings are invisible in the UI until they
 * are wrong — a clock that re-anchors on every request never fires at all, and
 * one that fires too eagerly nags on every ordinary page load. These cases pin
 * both edges.
 */
describe("slowRequestMonitor", () => {
  let dispatch;

  beforeEach(() => {
    vi.useFakeTimers();
    // Module state is shared across cases; a leaked pending count or live timer
    // would silently corrupt the next test.
    resetSlowRequestMonitor();
    dispatch = vi.spyOn(window, "dispatchEvent");
  });

  afterEach(() => {
    vi.useRealTimers();
    dispatch.mockRestore();
  });

  it("stays silent for a request that settles inside the hint window", () => {
    startRequest();
    vi.advanceTimersByTime(6_000);
    endRequest();
    vi.advanceTimersByTime(60_000);

    // A toast that flashes up after the page has already loaded is worse than
    // no toast, so nothing at all should be broadcast here.
    expect(slowEvents(dispatch)).toEqual([]);
  });

  it("hints at 7s and escalates to the cold-start explanation at 20s", () => {
    startRequest();

    vi.advanceTimersByTime(7_000);
    expect(slowEvents(dispatch).map((e) => e.detail.stage)).toEqual(["hint"]);

    vi.advanceTimersByTime(13_000);
    expect(slowEvents(dispatch).map((e) => e.detail.stage)).toEqual([
      "hint",
      "cold-start",
    ]);
  });

  it("sends the start timestamp so the toast can show elapsed time", () => {
    startRequest();
    vi.advanceTimersByTime(20_000);

    const [{ detail }] = slowEvents(dispatch).filter(
      (e) => e.detail.stage === "cold-start",
    );
    // Same anchor for both stages — the counter measures the whole wait, not the
    // time since the message changed.
    expect(detail.since).toBe(Date.now() - 20_000);
  });

  it("anchors the clock to the first request, not the most recent one", () => {
    startRequest();
    vi.advanceTimersByTime(5_000);
    // A second request joining a stalled batch must not push the deadline out;
    // on a cold start every page load does exactly this.
    startRequest();
    vi.advanceTimersByTime(2_000);

    expect(slowEvents(dispatch).map((e) => e.detail.stage)).toEqual(["hint"]);
  });

  it("reports the highest stage reached once traffic drains", () => {
    startRequest();
    startRequest();
    vi.advanceTimersByTime(20_000);

    // Still one request outstanding — the wait isn't over yet.
    endRequest();
    expect(
      slowEvents(dispatch).filter((e) => e.type === "api:slow-resolved"),
    ).toEqual([]);

    endRequest();
    const [resolved] = slowEvents(dispatch).filter(
      (e) => e.type === "api:slow-resolved",
    );
    // "cold-start" is what earns the sign-off toast; a bare "hint" clears quietly.
    expect(resolved.detail.stage).toBe("cold-start");
    expect(resolved.detail.durationMs).toBe(20_000);
  });

  it("resolves at the hint stage when the wait never reached cold-start", () => {
    startRequest();
    vi.advanceTimersByTime(10_000);
    endRequest();

    const [resolved] = slowEvents(dispatch).filter(
      (e) => e.type === "api:slow-resolved",
    );
    expect(resolved.detail.stage).toBe("hint");
  });

  it("never trips on back-to-back requests that each finish quickly", () => {
    // Sequential fast calls drop the in-flight count to zero in between, which
    // resets the clock — six of them spanning 30s must not look like a stall.
    for (let i = 0; i < 6; i += 1) {
      startRequest();
      vi.advanceTimersByTime(5_000);
      endRequest();
    }

    expect(slowEvents(dispatch)).toEqual([]);
  });

  it("ignores an unmatched endRequest instead of wedging the counter", () => {
    // A stray end would otherwise drive the count negative, leaving the next
    // startRequest at zero-plus-one but the clock never armed.
    endRequest();
    startRequest();
    vi.advanceTimersByTime(7_000);

    expect(slowEvents(dispatch).map((e) => e.detail.stage)).toEqual(["hint"]);
  });
});
