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
 * Parse a comma-separated model list from the environment.
 * @param {string|undefined} raw - e.g. "gemini-3.5-flash-lite,gemini-3.1-flash-lite".
 * @returns {readonly string[]|null} Frozen list, or null when unset or empty, so
 *   the caller can fall back to its own default. Frozen because
 *   Object.freeze(config) is shallow.
 */
const modelList = (raw) => {
  const models = (raw || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
  return models.length ? Object.freeze(models) : null;
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
  // Free, keyless host. A paid key is NOT accepted here — it is only honoured
  // by the pro host below, so the two must be switched together.
  microlinkApiBase: "https://api.microlink.io",
  microlinkProApiBase: "https://pro.microlink.io",
  // Deliberately NOT required(): the keyless tier covers this use, since
  // captures are per project change rather than per page view. A key only
  // exists on Microlink's paid plan.
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

  // ── Chatbot (optional — POST /api/chat, grounded in docs/chatbot-context.md) ──
  // Deliberately NOT required(): with no key the server boots normally, the
  // reference Markdown is still served, and only POST /api/chat degrades to a
  // friendly 503. Same stance as Redis and Microlink above.
  geminiApiKey: process.env.GEMINI_API_KEY?.trim(),
  geminiApiBase: "https://generativelanguage.googleapis.com/v1beta",
  // Models are tried in order until one answers. This is a quota strategy as
  // much as a resilience one: on the free tier each model carries its OWN
  // allowance, so two models is two budgets rather than one. It also covers the
  // 503 "high demand" a single busy model returns intermittently.
  //
  // Both are lite-tier, which is where the highest request-per-minute limits
  // are (15 and 10 RPM, against 5 for the standard flash models). Ordered
  // fastest-first from latency measured against this ~7.7KB prompt:
  //   gemini-3.5-flash-lite  ~1.5s
  //   gemini-3.1-flash-lite  ~6.5s
  //
  // Two ids that look plausible but are NOT usable here:
  //   gemini-2.5-flash-lite  404s with "no longer available to new users",
  //                          despite still appearing in the models list and the
  //                          quota dashboard. Google points at 3.5-flash-lite.
  //   gemini-3.5-flash       works, but takes 15-19s and returns 503 "high
  //                          demand" often enough to be unusable as a primary.
  //
  // Override with a comma-separated GEMINI_MODELS. Every id must support
  // structured output (responseSchema), which the follow-ups depend on.
  geminiModels:
    modelList(process.env.GEMINI_MODELS) ??
    Object.freeze(["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]),

  // Public origin of this API, used to cite the reference document's URL inside
  // the system prompt. Set it in production; the default suits local dev.
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:5000",

  // ── Chat generation + request shaping ──
  chatMaxOutputTokens: 600,
  chatTemperature: 0.3, // low — this is recall over a fixed document, not writing
  chatMaxMessageChars: 500,
  chatMaxHistoryTurns: 6, // 12 messages; older turns are dropped
  chatMaxHistoryChars: 1000, // per replayed message
  chatFollowUpCount: 2, // follow-up questions returned with every answer

  // ── Chat timeout ──
  // The server has no timeouts anywhere else; this exists because an LLM call
  // can hang indefinitely. Kept well inside the client's 90s axios timeout, so
  // the server always answers before the browser gives up.
  chatAttemptTimeoutMs: Number(process.env.CHAT_TIMEOUT_MS) || 15_000,
  // Caps the whole cascade, so two slow attempts cannot stack unbounded.
  chatTotalTimeoutMs: Number(process.env.CHAT_TOTAL_TIMEOUT_MS) || 30_000,

  // ── Chat rate limiting (layered on top of the global limiter above) ──
  // Fixed here rather than read from .env: these are a safety budget on a
  // public endpoint that spends money, not a per-deployment tuning knob.
  // chatBurstMax must stay <= rateLimitMax, or the global bucket binds first
  // and this tighter one never takes effect.
  chatBurstMax: 5, // CHAT_RATE_LIMIT_MAX
  chatBurstWindowSeconds: 60, // CHAT_RATE_LIMIT_WINDOW
  chatHourlyMax: 10, // CHAT_HOURLY_MAX
  chatHourlyWindowSeconds: 3600,
});

export default config;
