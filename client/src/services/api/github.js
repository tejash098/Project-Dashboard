import axios from "axios";
import api from "./client";
import { GITHUB_CONTRIBUTIONS_API_URL } from "../../config/github";

/**
 * GitHub data service.
 *
 * `fetchGitHubRepos` and `fetchContributionTotal` intentionally use bare
 * `axios` calls rather than the shared `client.js` instance: that client
 * injects a Bearer token and redirects to login on 401 against our own backend,
 * neither of which applies to third-party public APIs. GitHub allows ~60
 * unauthenticated requests/hour per visitor IP — ample for the one repo-list
 * fetch the Dashboard and the GitHub page each make per load.
 *
 * `fetchLanguageStats`, by contrast, DOES go through the shared client: the
 * heavy per-repo GitHub fan-out lives on our server behind
 * `GET /api/github/language-stats`, which caches totals in Redis (~24h TTL)
 * shared by every visitor.
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
 * Fetch the account's total GitHub contributions over the last 12 months.
 * Reads the same third-party API `react-github-calendar` renders the heatmap
 * from, so the Dashboard tile and the calendar footer always agree.
 * @param {string} username - GitHub account to look up.
 * @returns {Promise<number>} Contribution count for the trailing year.
 * @throws {Error} When the payload lacks a numeric total — callers treat any
 *   rejection as "unavailable" and fall back to a static snapshot.
 */
export const fetchContributionTotal = async (username) => {
  const res = await axios.get(`${GITHUB_CONTRIBUTIONS_API_URL}/${username}`, {
    params: { y: "last" },
  });
  const total = res.data?.total?.lastYear;
  if (typeof total !== "number") {
    throw new Error("Unexpected contributions payload");
  }
  return total;
};

/**
 * @typedef {Object.<string, number>} LanguageTotals
 * Map of language name → total bytes of code across all repos,
 * e.g. `{ JavaScript: 41250, Python: 20480 }`.
 */

/**
 * Get total bytes of code per language across all public non-fork repos.
 * The account is configured server-side (GITHUB_USERNAME); the server owns
 * the GitHub fan-out and serves the totals from a shared Redis cache.
 * @returns {Promise<LanguageTotals>} Bytes of code per language.
 */
export const fetchLanguageStats = async () =>
  (await api.get("/github/language-stats")).data.data;
