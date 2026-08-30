import "dotenv/config";

/**
 * Read a required environment variable. Logs a clear message and exits the
 * process when it's missing, so the server never starts in a half-configured
 * state (mirrors the fail-fast behavior in db.js).
 * @param {string} name - Environment variable name.
 * @returns {string} The variable's value.
 */
const required = (name) => {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
};

/**
 * Single source of truth for configuration — both env-derived values and
 * hardcoded tunables. Frozen so nothing can mutate config at runtime. This
 * module is the only place that loads dotenv; importing it anywhere guarantees
 * `.env` is loaded before any value is read.
 */
const config = Object.freeze({
  // ── Server ──
  port: process.env.PORT || 5000, // HTTP port (default 5000)

  // ── Database ──
  mongodbUri: required("MONGODB_URI"),
  // Public resolvers for mongodb+srv SRV/TXT lookups, which the local resolver refused.
  dnsServers: ["1.1.1.1", "8.8.8.8"],
  // Pinned MongoDB Stable API so server upgrades can't silently change behavior.
  mongoServerApi: { version: "1", strict: true, deprecationErrors: true },

  // ── Auth ──
  jwtSecret: required("JWT_SECRET"),
  tokenTtl: "7d", // JWT lifetime before re-login is required
  saltRounds: 10, // bcrypt cost factor

  // ── Admin seeding (optional — seedAdmin warns & skips when unset) ──
  adminUsername: process.env.ADMIN_USERNAME,
  adminPassword: process.env.ADMIN_PASSWORD,

  // ── Projects ──
  defaultProjectLimit: 100, // default cap for GET /api/projects

  // ── Cloudinary (feedback image uploads + project preview screenshots) ──
  cloudinaryCloudName: required("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: required("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: required("CLOUDINARY_API_SECRET"),

  // ── Project preview screenshots (Microlink → Cloudinary) ──
  // Captures run on create, on a liveUrl change, and on an explicit refresh —
  // never per page view — so the keyless tier is comfortably enough.
  microlinkApiBase: "https://api.microlink.io",
  // Deliberately NOT required(): the API works without a key; setting one only
  // raises the daily cap.
  microlinkApiKey: process.env.MICROLINK_API_KEY,
  // Desktop dimensions, so a framed site shows its desktop layout rather than
  // the mobile breakpoint a narrow card would trigger.
  previewViewport: { width: 1280, height: 800 },
  previewFolder: "project-previews", // Cloudinary folder, mirrors "feedback"

  // ── GitHub (language-stats endpoint) ──
  // Keep in sync with GITHUB_USERNAME in client/src/config/github.js — the
  // donut chart and the repos page should describe the same account.
  githubUsername: process.env.GITHUB_USERNAME || "tejash098",
  githubApiBase: "https://api.github.com",
  langStatsTtlSeconds: 86400, // how long cached language totals stay fresh (24h)

  // ── Redis (optional — cache for GitHub language stats) ──
  // Deliberately NOT required(): Redis is a cache the API degrades around.
  // When unset/unreachable the server boots fine and every request simply
  // behaves like a cache miss (direct GitHub fetch).
  redisUsername: process.env.REDIS_USERNAME || "default",
  redisPassword: process.env.REDIS_PASSWORD,
  redisHost: process.env.REDIS_HOST,
  redisPort: Number(process.env.REDIS_PORT) || 6379,

  // ── Rate limiting (per-IP, Redis-backed) ──
  // Configurable via env so production can tune without a redeploy.
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 15,
  rateLimitWindowSeconds: Number(process.env.RATE_LIMIT_WINDOW) || 60,
});

export default config;
