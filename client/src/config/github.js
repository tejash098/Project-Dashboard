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
