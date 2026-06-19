/**
 * Format an ISO date string as a long US date, e.g. "June 14, 2026".
 * Returns "—" for missing or invalid input rather than "Invalid Date".
 * @param {string} isoString - ISO date string (e.g. "2026-06-14").
 * @returns {string} Human-readable date, or "—".
 */
export const formatDate = (isoString) => {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
