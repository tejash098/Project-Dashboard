import axios from "axios";

/**
 * GitHub REST API service.
 *
 * Intentionally uses a bare `axios` call rather than the shared `client.js`
 * instance: that client injects a Bearer token and redirects to login on 401
 * against our own backend, neither of which applies to GitHub's public API.
 *
 * The unauthenticated API allows ~60 requests/hour per IP — ample for a personal
 * portfolio that fetches the repo list on page load.
 */

/** Base URL for the GitHub REST API. */
const GITHUB_API_BASE = "https://api.github.com";

/**
 * @typedef {Object} GitHubRepo
 * @property {number} id              - Unique repo id (stable React key).
 * @property {string} name           - Repository name.
 * @property {string} html_url       - Public URL of the repo on github.com.
 * @property {string|null} description - Short description (may be null).
 * @property {number} stargazers_count - Star count.
 * @property {string|null} language  - Primary language (may be null).
 * @property {string} updated_at     - ISO timestamp of the last update.
 * @property {boolean} fork          - Whether the repo is a fork.
 */

/**
 * Fetch a user's public, non-fork repositories, most recently updated first.
 * @param {string} username - GitHub account whose repos to fetch.
 * @returns {Promise<GitHubRepo[]>} Own repos (forks excluded), newest first.
 */
export const fetchGitHubRepos = async (username) => {
  const res = await axios.get(`${GITHUB_API_BASE}/users/${username}/repos`, {
    params: { sort: "updated", per_page: 100 },
  });
  // Drop forks — the page is a portfolio of original work.
  return res.data.filter((repo) => !repo.fork);
};

/**
 * @typedef {Object.<string, number>} LanguageTotals
 * Map of language name → total bytes of code across all repos,
 * e.g. `{ JavaScript: 41250, Python: 20480 }`.
 */

/** localStorage cache schema version — bump to invalidate old entries. */
const LANG_STATS_CACHE_VERSION = 1;

/** How long cached language totals stay fresh (24h). */
const LANG_STATS_TTL_MS = 24 * 60 * 60 * 1000;

/** localStorage key for a user's cached language totals. */
const langStatsCacheKey = (username) => `github:lang-stats:${username}`;

/**
 * In-flight requests keyed by username. StrictMode double-fires effects in dev,
 * and multiple components may mount at once — both callers share one promise
 * instead of each burning a full pass of the 60 req/hr unauthenticated quota.
 * @type {Map<string, Promise<LanguageTotals>>}
 */
const inflightLangStats = new Map();

/**
 * Read fresh language totals from localStorage, or null on miss.
 * Corrupt or stale entries are removed so the caller falls through to a fetch.
 * @param {string} username - GitHub account the cache entry belongs to.
 * @returns {LanguageTotals|null} Cached totals, or null when absent/stale.
 */
const readLangStatsCache = (username) => {
  const key = langStatsCacheKey(username);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    const valid =
      entry?.version === LANG_STATS_CACHE_VERSION &&
      typeof entry.fetchedAt === "number" &&
      entry.totals &&
      typeof entry.totals === "object";
    if (valid && Date.now() - entry.fetchedAt < LANG_STATS_TTL_MS) {
      return entry.totals;
    }
  } catch {
    // Corrupt JSON — treat as a miss and clear it below.
  }
  // Stale or corrupt — remove so we don't re-parse it every call.
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage unavailable (private mode etc.) — nothing to clean up.
  }
  return null;
};

/**
 * Persist language totals to localStorage. Failures (quota, private mode) are
 * swallowed — the cache is an optimization, never a requirement.
 * @param {string} username - GitHub account the totals belong to.
 * @param {LanguageTotals} totals - Aggregated byte counts to store.
 */
const writeLangStatsCache = (username, totals) => {
  try {
    localStorage.setItem(
      langStatsCacheKey(username),
      JSON.stringify({
        version: LANG_STATS_CACHE_VERSION,
        fetchedAt: Date.now(),
        totals,
      })
    );
  } catch {
    // Quota exceeded / storage unavailable — skip caching this pass.
  }
};

/**
 * Fetch every non-fork repo's per-language byte counts and aggregate them.
 * Costs 1 + N API requests, so this only runs on a cache miss.
 * @param {string} username - GitHub account whose code to measure.
 * @returns {Promise<LanguageTotals>} Bytes of code per language.
 */
const fetchLanguageTotals = async (username) => {
  // Reuse the repo list fetch (already fork-filtered). Empty repos are skipped:
  // their /languages response is `{}`, so the request would waste quota.
  const repos = (await fetchGitHubRepos(username)).filter((r) => r.size > 0);

  // Plain parallel fan-out — the list is bounded (≤100, realistically far
  // fewer) and api.github.com is HTTP/2, so the browser multiplexes fine.
  const results = await Promise.allSettled(
    repos.map((repo) =>
      axios.get(`${GITHUB_API_BASE}/repos/${username}/${repo.name}/languages`)
    )
  );

  /** @type {LanguageTotals} */
  const totals = {};
  let failed = 0;
  for (const result of results) {
    if (result.status !== "fulfilled") {
      failed += 1;
      continue;
    }
    for (const [lang, bytes] of Object.entries(result.value.data)) {
      totals[lang] = (totals[lang] || 0) + bytes;
    }
  }

  if (failed > 0 && failed === results.length && results.length > 0) {
    // Everything failed — surface the real cause. A 403 with an exhausted
    // quota header is the rate limiter, worth a friendlier message.
    const err = results[0].reason;
    const rateLimited =
      err?.response?.status === 403 &&
      err.response.headers?.["x-ratelimit-remaining"] === "0";
    throw rateLimited
      ? new Error("GitHub API rate limit exceeded — try again in an hour.")
      : err;
  }

  if (failed > 0) {
    // Partial data still renders a useful chart, but don't cache it — the
    // next visit should retry for a complete pass.
    console.warn(`[github] language stats incomplete: ${failed} repo(s) failed`);
  } else {
    writeLangStatsCache(username, totals);
  }
  return totals;
};

/**
 * Get a user's total bytes of code per language across all public non-fork
 * repos. Served from a 24h localStorage cache when possible; concurrent calls
 * for the same user share one in-flight request.
 * @param {string} username - GitHub account whose code to measure.
 * @returns {Promise<LanguageTotals>} Bytes of code per language.
 */
export const fetchLanguageStats = async (username) => {
  const cached = readLangStatsCache(username);
  if (cached) return cached;

  const pending = inflightLangStats.get(username);
  if (pending) return pending;

  const promise = fetchLanguageTotals(username).finally(() => {
    inflightLangStats.delete(username);
  });
  inflightLangStats.set(username, promise);
  return promise;
};
