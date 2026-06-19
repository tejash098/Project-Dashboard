import { useEffect, useState } from "react";
import PageLayout from "../layouts/PageLayout";
import FilterTabs from "../components/ui/FilterTabs";
import ProjectCard from "../components/ui/ProjectCard";
import { fetchProjects } from "../services/api";
import { getStatusCounts } from "../lib/projectStats";
import { GRID, SPACING, TYPOGRAPHY } from "../config/constants";

/**
 * Projects page — filterable, sorted grid of project cards fetched from the API.
 * Owns the filter state and drives the controlled FilterTabs.
 */
const Projects = () => {
  const [filter, setFilter] = useState("all");

  // ── Fetched data lifecycle ──
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load the project list once on mount.
  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  // Counts come from the full fetched list, not the filtered view, so the tabs
  // always show accurate totals.
  const counts = getStatusCounts(projects);

  // Derive the visible list from state — never store it.
  // .filter() returns a fresh array, so the following .sort() (newest first)
  // does not mutate the source data.
  const visibleProjects = projects
    .filter((project) => filter === "all" || project.status === filter)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return (
    <PageLayout title="Projects" subtitle="Browse and manage your projects">
      {/* ── Loading / error first, then the filtered grid ── */}
      {loading ? (
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-6`}>
          Loading projects…
        </p>
      ) : error ? (
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-6`}>
          Couldn’t load projects: {error}
        </p>
      ) : (
        <>
          {/* ── Status filter — counts derived from fetched data ── */}
          <FilterTabs filter={filter} onChange={setFilter} counts={counts} />

          {/* ── Results — grid, or an empty-state message ── */}
          {visibleProjects.length === 0 ? (
            <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-6`}>
              No projects found.
            </p>
          ) : (
            <div className={`${GRID.PROJECTS} ${SPACING.GAP_4} mt-6`}>
              {visibleProjects.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
};

export default Projects;
