import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * The regression net for turning the single global limiter into a factory. The
 * global bucket's Redis key format and budget must not move: live counters in a
 * running Redis have to survive the deploy, and app.js still imports the same
 * named export.
 */
const { mockConfig, mockRedis } = vi.hoisted(() => ({
  mockConfig: { rateLimitMax: 15, rateLimitWindowSeconds: 60 },
  mockRedis: { isReady: true, incr: vi.fn(), expire: vi.fn() },
}));

vi.mock("../config/env.js", () => ({ default: mockConfig }));
vi.mock("../config/redis.js", () => ({ redisClient: mockRedis }));

/** Minimal Express doubles — just the surface the middleware touches. */
const makeReq = (ip = "203.0.113.7") => ({ ip });
const makeRes = () => ({
  headers: {},
  statusCode: undefined,
  body: undefined,
  set(name, value) {
    this.headers[name] = value;
    return this;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

describe("rate limiting", () => {
  let rateLimit;
  let createRateLimit;

  beforeEach(async () => {
    // The module holds in-memory fallback buckets; re-importing clears them so
    // counts never leak between tests.
    vi.resetModules();
    mockRedis.isReady = true;
    mockRedis.incr.mockReset().mockResolvedValue(1);
    mockRedis.expire.mockReset().mockResolvedValue(1);
    ({ rateLimit, createRateLimit } = await import("../middleware/rateLimit.js"));
  });

  describe("the global limiter", () => {
    it("keeps its key format and budget after the refactor", async () => {
      // Both halves matter: a changed prefix orphans every live counter, and a
      // changed max silently retunes the whole API.
      const next = vi.fn();
      const res = makeRes();

      await rateLimit(makeReq(), res, next);

      expect(mockRedis.incr).toHaveBeenCalledWith("rate-limit:203.0.113.7");
      expect(res.headers["X-RateLimit-Limit"]).toBe("15");
      expect(res.headers["X-RateLimit-Remaining"]).toBe("14");
      expect(next).toHaveBeenCalled();
    });

    it("starts the expiry timer only on the first request in a window", async () => {
      await rateLimit(makeReq(), makeRes(), vi.fn());
      expect(mockRedis.expire).toHaveBeenCalledWith("rate-limit:203.0.113.7", 60);

      mockRedis.expire.mockClear();
      mockRedis.incr.mockResolvedValue(2);
      await rateLimit(makeReq(), makeRes(), vi.fn());
      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    it("lets requests through when Redis is unavailable", async () => {
      // Degrade-open is deliberate for the global bucket: browsing must not
      // break because a cache is down.
      mockRedis.isReady = false;
      const next = vi.fn();
      const res = makeRes();

      await rateLimit(makeReq(), res, next);

      expect(next).toHaveBeenCalled();
      expect(res.statusCode).toBeUndefined();
      expect(res.headers).toEqual({});
    });

    it("lets requests through when Redis throws", async () => {
      mockRedis.incr.mockRejectedValue(new Error("connection reset"));
      const next = vi.fn();

      await rateLimit(makeReq(), makeRes(), next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("a route-scoped bucket", () => {
    const chatBucket = (overrides = {}) =>
      createRateLimit({
        max: 5,
        windowSeconds: 60,
        prefix: "chat-limit",
        ...overrides,
      });

    it("counts under its own prefix, independent of the global bucket", async () => {
      // Independence is the point: spending the chat allowance must not stop
      // the visitor from loading pages.
      await chatBucket()(makeReq(), makeRes(), vi.fn());

      expect(mockRedis.incr).toHaveBeenCalledWith("chat-limit:203.0.113.7");
      expect(mockRedis.incr).not.toHaveBeenCalledWith("rate-limit:203.0.113.7");
    });

    it("rejects with 429, Retry-After, and the API error envelope", async () => {
      mockRedis.incr.mockResolvedValue(6);
      const next = vi.fn();
      const res = makeRes();

      await chatBucket()(makeReq(), res, next);

      expect(res.statusCode).toBe(429);
      expect(res.headers["Retry-After"]).toBe("60");
      expect(res.headers["X-RateLimit-Remaining"]).toBe("0");
      expect(res.body).toEqual({
        status: "error",
        message: "Rate limit exceeded. Try again in a minute.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("phrases an hourly window in hours, not seconds", async () => {
      // "Try again in 3600 seconds" is the kind of message that reads as a bug.
      mockRedis.incr.mockResolvedValue(11);
      const res = makeRes();

      await createRateLimit({
        max: 10,
        windowSeconds: 3600,
        prefix: "chat-limit-h",
      })(makeReq(), res, vi.fn());

      expect(res.body.message).toBe("Rate limit exceeded. Try again in an hour.");
    });

    it("keeps counting in memory when Redis is gone, if asked to", async () => {
      // Unlike page loads, an unlimited chat endpoint spends real money — so
      // this bucket deliberately degrades closed rather than open.
      mockRedis.isReady = false;
      const limiter = chatBucket({ max: 2, fallbackInMemory: true });

      const first = makeRes();
      await limiter(makeReq(), first, vi.fn());
      await limiter(makeReq(), makeRes(), vi.fn());

      const third = makeRes();
      const next = vi.fn();
      await limiter(makeReq(), third, next);

      expect(first.headers["X-RateLimit-Remaining"]).toBe("1");
      expect(third.statusCode).toBe(429);
      expect(next).not.toHaveBeenCalled();
    });

    it("keeps in-memory counts separate per IP", async () => {
      mockRedis.isReady = false;
      const limiter = chatBucket({ max: 1, fallbackInMemory: true });

      await limiter(makeReq("198.51.100.1"), makeRes(), vi.fn());

      const other = makeRes();
      const next = vi.fn();
      await limiter(makeReq("198.51.100.2"), other, next);

      expect(next).toHaveBeenCalled();
      expect(other.statusCode).toBeUndefined();
    });
  });
});
