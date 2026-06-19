/**
 * Tally total + per-status counts for stat cards and filter tabs.
 * @param {import("../services/api").Project[]} projects - Source list.
 * @returns {{ total: number, active: number, completed: number }} Status counts.
 */
export const getStatusCounts = (projects) =>
  projects.reduce(
    (counts, project) => {
      counts.total += 1;
      counts[project.status] = (counts[project.status] || 0) + 1;
      return counts;
    },
    { total: 0, active: 0, completed: 0 },
  );
