import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Boot awaits connectRedis so the first requests hit a ready cache — a
 * language-stats request served before Redis is ready reads as a miss and
 * spends ~25 GitHub API calls. But Redis is optional, so the wait must be
 * bounded and must never reject or crash the process. These cases pin all
 * three edges.
 */
const { mockConfig, mockClient } = vi.hoisted(() => ({
  mockConfig: {
    redisHost: "redis.test",
    redisPort: 6379,
    redisUsername: "default",
    redisPassword: "not-a-real-password",
    redisConnectTimeoutMs: 3000,
  },
  mockClient: { on: vi.fn(), connect: vi.fn() },
}));

vi.mock("../config/env.js", () => ({ default: mockConfig }));
vi.mock("redis", () => ({ createClient: () => mockClient }));

const { connectRedis } = await import("../config/redis.js");

describe("connectRedis", () => {
  let warn;
  let error;

  beforeEach(() => {
    vi.useFakeTimers();
    mockClient.connect.mockReset();
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    error = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("resolves as soon as Redis is ready", async () => {
    mockClient.connect.mockResolvedValue(mockClient);

    await connectRedis();

    expect(warn).not.toHaveBeenCalled();
  });

  it("stops waiting at the timeout when connect never settles", async () => {
    // node-redis retries a bad host forever, so connect() may never settle.
    mockClient.connect.mockReturnValue(new Promise(() => {}));

    let done = false;
    const waiting = connectRedis().then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(2999);
    expect(done).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await waiting;
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("not ready after 3000ms"));
  });

  it("handles a connect failure that lands after the timeout", async () => {
    // Nothing awaits connect() once the timeout wins — an unhandled rejection
    // here would crash the process (and fail this test run).
    mockClient.connect.mockReturnValue(
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("WRONGPASS")), 5000);
      }),
    );

    const waiting = connectRedis();
    await vi.advanceTimersByTimeAsync(3000);
    await waiting;
    await vi.advanceTimersByTimeAsync(2000);

    expect(error).toHaveBeenCalledWith("[redis] initial connect failed:", "WRONGPASS");
  });
});
