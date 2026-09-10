import { useEffect, useState } from "react";
import {
  fetchContributionTotal,
  fetchGitHubRepos,
} from "../services/api/github";

/**
 * @typedef {Object} GitHubStats
 * @property {number|null} contributions - Contributions in the last 12 months,
 *   or null while loading / when the lookup failed.
 * @property {number|null} repoCount - Public non-fork repositories, or null
 *   while loading / when the lookup failed.
 */

/**
 * Load the live GitHub numbers for the Dashboard stat tiles. Both lookups run
 * in parallel and settle independently, so one third-party API being down
 * never blanks the other tile. `null` means "unavailable": callers substitute
 * a static snapshot — a stat tile never renders an error state.
 * @param {string} username - GitHub account to read.
 * @returns {GitHubStats} Live numbers, null until each resolves.
 */
export const useGitHubStats = (username) => {
  const [stats, setStats] = useState({ contributions: null, repoCount: null });

  useEffect(() => {
    // Ignore-flag cleanup: a late response must not set state after unmount
    // (or after the username changed and a newer effect took over).
    let ignore = false;
    (async () => {
      console.log("[useGitHubStats] loading GitHub stats…");
      // allSettled never rejects, so no try/catch: each result is inspected
      // on its own and a rejection simply leaves that number null.
      const [contrib, repos] = await Promise.allSettled([
        fetchContributionTotal(username),
        fetchGitHubRepos(username),
      ]);
      if (contrib.status === "rejected") {
        console.error(
          "[useGitHubStats] contributions failed:",
          contrib.reason?.message
        );
      }
      if (repos.status === "rejected") {
        console.error("[useGitHubStats] repos failed:", repos.reason?.message);
      }
      // One state object → one re-render once both have settled.
      if (!ignore) {
        setStats({
          contributions:
            contrib.status === "fulfilled" ? contrib.value : null,
          repoCount: repos.status === "fulfilled" ? repos.value.length : null,
        });
      }
    })();
    return () => {
      ignore = true;
    };
  }, [username]);

  return stats;
};
