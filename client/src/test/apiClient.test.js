import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AxiosError } from "axios";
import api from "../services/api/client.js";
import { resetSlowRequestMonitor } from "../services/api/slowRequestMonitor.js";

/**
 * Build a per-request axios adapter that fails with a network error (no
 * response, like a refused connection) a set number of times, then answers.
 * Passed as request config, so it rides along in `error.config` and every
 * retry hits it too.
 *
 * @param {number} failures - Attempts to fail before succeeding (Infinity: never).
 * @returns {import("vitest").Mock} The adapter, for counting attempts.
 */
const flakyAdapter = (failures) => {
  let calls = 0;
  return vi.fn(async (config) => {
    calls += 1;
    if (calls <= failures) {
      throw new AxiosError("Network Error", AxiosError.ERR_NETWORK, config);
    }
    return { data: { data: "ok" }, status: 200, statusText: "OK", headers: {}, config };
  });
};

/**
 * Count `api:unreachable` broadcasts in a dispatchEvent spy — each one is a
 * "Couldn't reach the server" toast the visitor sees.
 * @param {import("vitest").MockInstance} spy - The dispatchEvent spy.
 * @returns {number} How many were dispatched.
 */
const unreachableCount = (spy) =>
  spy.mock.calls.filter(([event]) => event.type === "api:unreachable").length;

/**
 * Pages fetch once on mount, so a page that loads while the API is still
 * booting used to stay on its error state until a manual reload. The client
 * now re-sends GETs that never reached the server. These cases pin what gets
 * retried, and that the visitor sees one toast at the end rather than one per
 * attempt.
 */
describe("api client retry", () => {
  let dispatch;

  beforeEach(() => {
    vi.useFakeTimers();
    resetSlowRequestMonitor();
    dispatch = vi.spyOn(window, "dispatchEvent");
    // Silence the interceptor's per-attempt logging.
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("re-sends a GET until the server answers, without an unreachable toast", async () => {
    const adapter = flakyAdapter(2);

    const pending = api.get("/github/language-stats", { adapter });
    await vi.advanceTimersByTimeAsync(1_000 + 2_000);
    const res = await pending;

    expect(res.data.data).toBe("ok");
    expect(adapter).toHaveBeenCalledTimes(3);
    expect(unreachableCount(dispatch)).toBe(0);
  });

  it("gives up after four retries and toasts once", async () => {
    const adapter = flakyAdapter(Infinity);

    const pending = api.get("/projects", { adapter });
    // Attach the assertion before advancing, so the rejection is never unhandled.
    const assertion = expect(pending).rejects.toThrow("Network Error");
    await vi.advanceTimersByTimeAsync(1_000 + 2_000 + 4_000 + 8_000);
    await assertion;

    expect(adapter).toHaveBeenCalledTimes(5);
    expect(unreachableCount(dispatch)).toBe(1);
  });

  it("never re-sends a POST", async () => {
    // A write may have reached the server before the connection dropped;
    // repeating it could create a duplicate.
    const adapter = flakyAdapter(Infinity);

    await expect(api.post("/feedback", {}, { adapter })).rejects.toThrow("Network Error");

    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it("does not retry when the server answered with an error status", async () => {
    // Our 503 means "GitHub rate limit, try in an hour" — repeating it in a
    // few seconds would only delay the message.
    const adapter = vi.fn(async (config) => {
      throw new AxiosError(
        "Request failed with status code 503",
        AxiosError.ERR_BAD_RESPONSE,
        config,
        null,
        { status: 503, data: { message: "rate limited" }, headers: {}, config },
      );
    });

    await expect(api.get("/github/language-stats", { adapter })).rejects.toThrow("503");

    expect(adapter).toHaveBeenCalledTimes(1);
  });
});
