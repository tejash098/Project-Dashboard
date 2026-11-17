import config from "../config/env.js";
import { redisClient } from "../config/redis.js";

/**
 * Per-IP rate limiting, as a factory.
 *
 * Uses a fixed-window counter: each IP gets a Redis key (`<prefix>:<ip>`) that
 * is atomically incremented on every request and auto-expires after the
 * window. Once the count exceeds the maximum, further requests get a 429 with a
 * `Retry-After` header.
 *
 * The factory exists so one route can carry a tighter budget than the global
 * one without a second copy of the counter logic. Each bucket owns its own key
 * prefix, so budgets are independent — a visitor who spends their chat
 * allowance can still browse the site.
 */

/**
 * In-memory counters, used only while Redis is unavailable and only by buckets
 * that opt into `fallbackInMemory` (every bucket in this app does). Redis stays
 * the source of truth whenever it is connected. Per-process and therefore
 * approximate behind multiple instances, which is fine: it exists so an outage
 * never leaves the API unmetered, not to be exact.
 * @type {Map<string, { count: number, resetAt: number }>}
 */
const memoryBuckets = new Map();

/** Sweep expired in-memory buckets once the map grows past this many entries. */
const MEMORY_SWEEP_THRESHOLD = 10_000;

/**
 * Increment an in-memory fixed-window counter.
 * @param {string} key - Bucket key (`<prefix>:<ip>`).
 * @param {number} windowSeconds - Window length.
 * @returns {number} The request count within the current window.
 */
const memoryIncrement = (key, windowSeconds) => {
  const now = Date.now();

  // Bounded growth: one pass over the map when it gets large, rather than a
  // timer that would keep the process alive.
  if (memoryBuckets.size > MEMORY_SWEEP_THRESHOLD) {
    for (const [existing, bucket] of memoryBuckets) {
      if (bucket.resetAt <= now) memoryBuckets.delete(existing);
    }
  }

  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return 1;
  }
  bucket.count += 1;
  return bucket.count;
};

/**
 * Phrase a window for the visitor, so an hourly bucket does not tell someone to
 * wait "3600 seconds".
 * @param {number} seconds - Window length.
 * @returns {string} A human-readable duration.
 */
const describeWindow = (seconds) => {
  if (seconds % 3600 === 0) {
    const hours = seconds / 3600;
    return hours === 1 ? "an hour" : `${hours} hours`;
  }
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return minutes === 1 ? "a minute" : `${minutes} minutes`;
  }
  return `${seconds} seconds`;
};

/**
 * Build a per-IP fixed-window rate limiter.
 *
 * @param {Object} options
 * @param {number} options.max - Requests allowed per window.
 * @param {number} options.windowSeconds - Window length in seconds.
 * @param {string} options.prefix - Redis key prefix; the client IP is appended.
 * @param {boolean} [options.fallbackInMemory] - Count in this process when Redis
 *   is unavailable, instead of letting the request through. Off by default in
 *   the factory, but every bucket in this app turns it on: Redis is optional
 *   here, so degrading open would leave the API unlimited for whole deploys.
 * @returns {import("express").RequestHandler} The middleware.
 */
export const createRateLimit =
  ({ max, windowSeconds, prefix, fallbackInMemory = false }) =>
  async (req, res, next) => {
    const ip = req.ip; // real client IP (trust proxy is set in app.js)
    const key = `${prefix}:${ip}`;

    let count;
    if (redisClient?.isReady) {
      try {
        // Atomically increment; creates the key with value 1 if new.
        count = await redisClient.incr(key);
        // First request in this window → start the expiry timer.
        if (count === 1) await redisClient.expire(key, windowSeconds);
      } catch (err) {
        console.warn("[rate-limit] Redis error:", err.message);
        if (!fallbackInMemory) return next();
        count = memoryIncrement(key, windowSeconds);
      }
    } else if (fallbackInMemory) {
      count = memoryIncrement(key, windowSeconds);
    } else {
      // Redis down or unconfigured, and this bucket did not ask for the
      // in-memory fallback → skip limiting.
      return next();
    }

    // Informational headers on every response. When two buckets guard the same
    // route the later one wins, which is what we want: it is the tighter budget.
    res.set("X-RateLimit-Limit", String(max));
    res.set("X-RateLimit-Remaining", String(Math.max(0, max - count)));

    if (count > max) {
      console.warn(
        `[rate-limit] ${ip} exceeded ${max} req/${windowSeconds}s on "${prefix}" (count=${count})`,
      );
      res.set("Retry-After", String(windowSeconds));
      return res.status(429).json({
        status: "error",
        message: `Rate limit exceeded. Try again in ${describeWindow(windowSeconds)}.`,
      });
    }

    next();
  };

/**
 * Global limiter, applied in app.js — no routes are exempt.
 *
 * Same 15 req/60s default and `rate-limit:<ip>` key format as before the
 * factory refactor (so counters in a live Redis survive the deploy).
 *
 * Counts in Redis whenever it is connected and falls back to process memory
 * when it is not. It used to degrade open instead, which meant a deploy without
 * Redis had no limit on anything but chat — including the GitHub stats route,
 * which loses its cache in the same outage and would hit GitHub on every call.
 */
export const rateLimit = createRateLimit({
  max: config.rateLimitMax,
  windowSeconds: config.rateLimitWindowSeconds,
  prefix: "rate-limit",
  fallbackInMemory: true,
});
