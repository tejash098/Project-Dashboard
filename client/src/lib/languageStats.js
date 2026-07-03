/**
 * Pure helpers for turning GitHub language data into chart slices and
 * filter-chip counts. No fetching here — see services/api/github.js.
 */

/** Label for the folded "everything else" donut slice. */
export const OTHER_LABEL = "Other";

/** Sentinel filter value for repos whose `language` is null. */
export const NO_LANGUAGE = "none";

/**
 * @typedef {Object} DonutSlice
 * @property {string} name    - Language name (or "Other").
 * @property {number} value   - Total bytes of code.
 * @property {number} percent - Share of all bytes, rounded to 1 decimal.
 */

/**
 * Shape language byte totals into donut slices: the biggest languages keep
 * their own slice, the long tail folds into "Other" (always last). A donut
 * stops being readable past ~6 segments, hence the cap.
 * @param {import("../services/api/github").LanguageTotals} totals - Bytes per language.
 * @param {number} [maxSlices=6] - Maximum slices including "Other".
 * @returns {DonutSlice[]} Slices sorted largest-first, "Other" last; empty for no data.
 */
export const buildDonutData = (totals, maxSlices = 6) => {
  const entries = Object.entries(totals || {}).sort((a, b) => b[1] - a[1]);
  const grandTotal = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (grandTotal === 0) return [];

  // Fold the tail into "Other" — unless the tail is a single language, where
  // showing it by name is strictly more informative than an "Other" of one.
  const tail = entries.slice(maxSlices - 1);
  const kept = tail.length > 1 ? entries.slice(0, maxSlices - 1) : entries;

  const slices = kept.map(([name, value]) => ({ name, value }));
  if (tail.length > 1) {
    slices.push({
      name: OTHER_LABEL,
      value: tail.reduce((sum, [, bytes]) => sum + bytes, 0),
    });
  }

  // Rounded percents are display-only and may not sum to exactly 100.
  return slices.map((slice) => ({
    ...slice,
    percent: Math.round((slice.value / grandTotal) * 1000) / 10,
  }));
};

/**
 * Tally repos per primary language for the GitHub page's filter chips.
 * The `total` key is load-bearing: FilterTabs maps the "all" chip to it.
 * Null-language repos count under the NO_LANGUAGE sentinel.
 * @param {import("../services/api/github").GitHubRepo[]} repos - Source list.
 * @returns {{ total: number, [language: string]: number }} Per-language counts.
 */
export const getLanguageCounts = (repos) =>
  repos.reduce(
    (counts, repo) => {
      counts.total += 1;
      const key = repo.language ?? NO_LANGUAGE;
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    },
    { total: 0 },
  );
