import config from "../config/env.js";
import { redisClient } from "../config/redis.js";

/**
 * Per-IP rate limiting middleware backed by Redis.
 *
 * Uses a fixed-window counter: each IP gets a Redis key (`rate-limit:<ip>`)
 * that is atomically incremented on every request and auto-expires after
 * `WINDOW` seconds. Once the count exceeds `MAX`, subsequent requests receive
 * a 429 with a `Retry-After` header.
 *
 * Graceful degradation: when Redis is unconfigured, unreachable, or mid-
 * reconnect, the middleware silently skips rate limiting and calls `next()`.
 *
 * Applied globally in app.js — no routes are exempt.
 *
 * @param {import("express").Request}      req  - Express request (reads `req.ip`).
 * @param {import("express").Response}     res  - Express response.
 * @param {import("express").NextFunction} next - Passes control to the next handler.
 */

const MAX = config.rateLimitMax; // 15
const WINDOW = config.rateLimitWindowSeconds; // 60

export const rateLimit = async (req, res, next) => {
  // Redis down or unconfigured → skip rate limiting (graceful degradation).
  if (!redisClient?.isReady) return next();

  const ip = req.ip; // real client IP (trust proxy is set in app.js)
  const key = `rate-limit:${ip}`;

  try {
    // Atomically increment the counter; creates the key with value 1 if new.
    const count = await redisClient.incr(key);

    // First request in this window → start the expiry timer.
    if (count === 1) {
      await redisClient.expire(key, WINDOW);
    }

    // Informational headers on every response.
    res.set("X-RateLimit-Limit", String(MAX));
    res.set("X-RateLimit-Remaining", String(Math.max(0, MAX - count)));

    // Over the limit → 429.
    if (count > MAX) {
      console.warn(`[rate-limit] ${ip} exceeded ${MAX} req/${WINDOW}s (count=${count})`);
      res.set("Retry-After", String(WINDOW));
      return res.status(429).json({
        status: "error",
        message: `Rate limit exceeded. Try again in ${WINDOW} seconds.`,
      });
    }

    next();
  } catch (err) {
    // Redis hiccup — log and let the request through.
    console.warn("[rate-limit] Redis error, skipping:", err.message);
    next();
  }
};
