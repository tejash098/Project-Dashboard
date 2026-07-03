import { useEffect, useState } from "react";
import { fetchLanguageStats } from "../services/api/github";

/**
 * Load a user's per-language code byte totals (cached ~24h in localStorage by
 * the service layer). Follows the app's standard fetch lifecycle so callers
 * can render the usual loading / error / empty branches.
 * @param {string} username - GitHub account whose code to measure.
 * @returns {{
 *   totals: import("../services/api/github").LanguageTotals|null,
 *   loading: boolean,
 *   error: string|null,
 * }} Fetch lifecycle state.
 */
export const useLanguageStats = (username) => {
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Ignore-flag cleanup: a late response must not set state after unmount
    // (or after the username changed and a newer effect took over).
    let ignore = false;
    (async () => {
      console.log("[useLanguageStats] loading language stats…");
      try {
        const stats = await fetchLanguageStats(username);
        console.log(
          `[useLanguageStats] loaded ${Object.keys(stats).length} languages`
        );
        if (!ignore) setTotals(stats);
      } catch (err) {
        console.error("[useLanguageStats] load failed:", err.message);
        if (!ignore) setError(err.response?.data?.message || err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [username]);

  return { totals, loading, error };
};
