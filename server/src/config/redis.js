import { createClient } from "redis";
import config from "./env.js";

/**
 * Redis cache client (optional infrastructure).
 *
 * The API must degrade gracefully around Redis: when it's unconfigured,
 * unreachable, or mid-reconnect, every cache call behaves like a miss instead
 * of hanging or crashing. Controllers therefore never touch the client
 * directly — they go through the `cacheGet`/`cacheSet` wrappers below.
 */

// null when REDIS_HOST is unset — caching is silently disabled.
const client = config.redisHost
  ? createClient({
      username: config.redisUsername,
      password: config.redisPassword,
      socket: { host: config.redisHost, port: config.redisPort },
      // Fail commands immediately while disconnected instead of queueing them
      // (a queued command would stall the request until reconnect).
      disableOfflineQueue: true,
    })
  : null;

if (client) {
  // MUST be attached before connect(): node-redis emits an 'error' event on
  // every failed (re)connect attempt, and an unhandled 'error' event crashes
  // the Node process.
  client.on("error", (err) => {
    console.error("[redis] client error:", err.message);
  });
  client.on("ready", () => {
    console.log("[redis] connected");
  });
}

/**
 * Kick off the Redis connection. Intentionally safe to fire-and-forget from
 * the bootstrap: a bad host/password must log — never hang or kill the boot
 * (node-redis retries forever by default, so connect() may never settle).
 * @returns {Promise<void>} Resolves when connected or after a logged failure.
 */
export const connectRedis = async () => {
  if (!client) {
    console.warn("[redis] REDIS_HOST not set — language-stats caching disabled");
    return;
  }
  try {
    await client.connect();
  } catch (err) {
    // Keep serving traffic without a cache; reconnects continue in background.
    console.error("[redis] initial connect failed:", err.message);
  }
};

/**
 * Read a key from the cache. A disconnected/unconfigured Redis (or any Redis
 * error) reads as a cache miss.
 * @param {string} key - Cache key.
 * @returns {Promise<string|null>} The stored string value, or null on miss.
 */
export const cacheGet = async (key) => {
  if (!client?.isReady) return null;
  try {
    return await client.get(key);
  } catch (err) {
    console.warn("[redis] GET failed:", err.message);
    return null;
  }
};

/**
 * Write a key with a TTL. Failures are logged and swallowed — the cache is an
 * optimization, never a requirement.
 * @param {string} key - Cache key.
 * @param {string} value - String value to store (JSON.stringify beforehand).
 * @param {number} ttlSeconds - Expiry in seconds (Redis EX).
 * @returns {Promise<void>}
 */
export const cacheSet = async (key, value, ttlSeconds) => {
  if (!client?.isReady) return;
  try {
    await client.set(key, value, { EX: ttlSeconds });
  } catch (err) {
    console.warn("[redis] SET failed:", err.message);
  }
};
