import config from "../config/env.js";
import { cacheGet, cacheSet } from "../config/redis.js";

/**
 * @typedef {Object.<string, number>} LanguageTotals
 * Map of language name → total bytes of code across all repos,
 * e.g. `{ JavaScript: 41250, Python: 20480 }`.
 */

/** Redis key for a user's cached language totals. */
const langStatsCacheKey = (username) => `github:lang-stats:${username}`;

/**
 * In-flight GitHub fan-out. The username is fixed server-side, so a single
 * module-level promise suffices: concurrent requests during a cache miss
 * share one GitHub pass instead of each burning 1+N of the server IP's
 * ~60 req/hr unauthenticated quota.
 * @type {Promise<{ totals: LanguageTotals, complete: boolean }>|null}
 */
let inflightFanout = null;

/**
 * GET a GitHub API URL and parse the JSON body. Unlike axios, native fetch
 * resolves on HTTP error statuses, so failures are converted to throws here —
 * tagging rate-limit exhaustion so the handler can pick a friendly message.
 * @param {string} url - Absolute GitHub API URL.
 * @returns {Promise<any>} Parsed JSON body.
 * @throws {Error & { status?: number, rateLimited?: boolean }} On any non-2xx response.
 */
const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`GitHub responded ${res.status} for ${url}`);
    err.status = res.status;
    err.rateLimited =
      res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0";
    throw err;
  }
  return res.json();
};

/**
 * Fetch every public non-fork repo's per-language byte counts and aggregate
 * them. Costs 1 + N GitHub requests, so this only runs on a cache miss.
 * @param {string} username - GitHub account whose code to measure.
 * @returns {Promise<{ totals: LanguageTotals, complete: boolean }>} Aggregated
 *   bytes per language; `complete` is false when some repos failed (partial
 *   data is returned to the caller but must not be cached).
 * @throws {Error & { rateLimited?: boolean }} When every request failed.
 */
const fetchLanguageTotals = async (username) => {
  // Forks are excluded (portfolio of original work) and empty repos are
  // skipped — their /languages response is `{}`, so the request wastes quota.
  const repos = (
    await fetchJson(
      `${config.githubApiBase}/users/${username}/repos?sort=updated&per_page=100`,
    )
  ).filter((repo) => !repo.fork && repo.size > 0);

  // Plain parallel fan-out — the list is bounded (≤100, realistically far
  // fewer) and api.github.com is HTTP/2, so requests multiplex fine.
  const results = await Promise.allSettled(
    repos.map((repo) =>
      fetchJson(`${config.githubApiBase}/repos/${username}/${repo.name}/languages`),
    ),
  );

  /** @type {LanguageTotals} */
  const totals = {};
  let failed = 0;
  for (const result of results) {
    if (result.status !== "fulfilled") {
      failed += 1;
      continue;
    }
    for (const [lang, bytes] of Object.entries(result.value)) {
      totals[lang] = (totals[lang] || 0) + bytes;
    }
  }

  if (failed > 0 && failed === results.length && results.length > 0) {
    // Everything failed — rethrow the real cause (the handler's catch maps
    // the rateLimited flag to a friendly message and a 503).
    throw results[0].reason;
  }

  if (failed > 0) {
    console.warn(`[github] language stats incomplete: ${failed} repo(s) failed`);
  }
  return { totals, complete: failed === 0 };
};

/**
 * GET /api/github/language-stats
 * Total bytes of code per language across the configured account's public
 * non-fork repos. Served from Redis when fresh (24h TTL); on a miss the
 * server fans out to GitHub, caches complete results, and returns them.
 * The account comes from server config only — a client-supplied username is
 * deliberately not accepted, so the endpoint can't be used as a GitHub proxy.
 * @param {import("express").Request} req - Express request.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 200 `{ status, data }`, 503 `{ status, message }`
 *   when GitHub's rate limit is exhausted, or 500 `{ status, message }`.
 */
export const getLanguageStats = async (req, res) => {
  try {
    const username = config.githubUsername;
    const key = langStatsCacheKey(username);

    const cached = await cacheGet(key);
    if (cached) {
      try {
        const totals = JSON.parse(cached);
        console.log(`[github] lang-stats cache hit (${username})`);
        return res.status(200).json({ status: "success", data: totals });
      } catch {
        // Corrupt cache entry — treat as a miss and refetch below.
        console.warn("[github] corrupt cache entry — refetching");
      }
    }

    if (!inflightFanout) {
      console.log(`[github] lang-stats cache miss — fetching from GitHub (${username})`);
      inflightFanout = fetchLanguageTotals(username).finally(() => {
        inflightFanout = null;
      });
    }
    const { totals, complete } = await inflightFanout;

    // Partial data still serves this response, but only complete passes are
    // cached so the next request retries for the full picture.
    if (complete) {
      await cacheSet(key, JSON.stringify(totals), config.langStatsTtlSeconds);
    }
    res.status(200).json({ status: "success", data: totals });
  } catch (error) {
    console.error("[github] language-stats error:", error.message);
    // 503: upstream (GitHub) temporarily unavailable, not a fault of ours.
    // The rateLimited flag can come from the repo-list call or the fan-out —
    // both get the friendly message here rather than the raw GitHub error.
    if (error.rateLimited) {
      return res.status(503).json({
        status: "error",
        message: "GitHub API rate limit exceeded — try again in an hour.",
      });
    }
    res.status(500).json({ status: "error", message: error.message });
  }
};
