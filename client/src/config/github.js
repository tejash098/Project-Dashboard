/**
 * GitHub configuration.
 * Single source of truth for the GitHub account surfaced across the app — the
 * repos page, the dashboard contribution calendar, and the Contact channel.
 * Update the username here and every consumer follows.
 */

/** GitHub username whose public repos and activity are displayed. */
export const GITHUB_USERNAME = "tejash098";

/** Public profile URL, derived from the username. */
export const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;

/** Public repositories tab URL, derived from the profile URL. */
export const GITHUB_REPOS_URL = `${GITHUB_PROFILE_URL}?tab=repositories`;

/**
 * Third-party contributions API (the one `react-github-calendar` fetches from).
 * The Dashboard's contributions tile reads the same endpoint, so the tile and
 * the heatmap's own "… contributions in the last year" footer never disagree.
 */
export const GITHUB_CONTRIBUTIONS_API_URL =
  "https://github-contributions-api.jogruber.de/v4";

/**
 * Static snapshot of the live GitHub numbers on the Dashboard tiles, shown
 * while the live fetch is in flight and kept if it fails — a stat tile never
 * renders an error. Snapshot taken 2026-09-10 (22 public repos, 1 fork);
 * refresh occasionally so a failed fetch still shows a plausible number.
 */
export const GITHUB_STATS_FALLBACK = { contributions: 388, repoCount: 21 };
