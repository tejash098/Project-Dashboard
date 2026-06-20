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
});

export default config;
