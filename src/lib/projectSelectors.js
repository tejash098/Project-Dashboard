import projects from "../data/projects";

/** @typedef {import("../data/projects").Project} Project */

/**
 * Return every project. Becomes an API call when a backend is added.
 * @returns {Project[]} All projects.
 */
export const getAllProjects = () => projects;

/**
 * Find a single project by its slug id.
 * @param {string} id - Project slug to look up.
 * @returns {Project|undefined} Matching project, or undefined if none.
 */
export const getProjectById = (id) =>
  projects.find((project) => project.id === id);

/**
 * Filter projects by their status.
 * @param {"active"|"completed"} status - Status to match.
 * @returns {Project[]} Projects with the given status.
 */
export const getProjectsByStatus = (status) =>
  projects.filter((project) => project.status === status);

/**
 * Get only the projects flagged as featured.
 * @returns {Project[]} Featured projects.
 */
export const getFeaturedProjects = () =>
  projects.filter((project) => project.featured);

/**
 * Tally the total project count and a count per status for the stat cards.
 * @returns {{ total: number, active: number, completed: number }} e.g. { total: 6, active: 3, completed: 3 }.
 */
export const getStatusCounts = () =>
  projects.reduce(
    (counts, project) => {
      counts.total += 1;
      counts[project.status] = (counts[project.status] || 0) + 1;
      return counts;
    },
    { total: 0, active: 0, completed: 0 }
  );
