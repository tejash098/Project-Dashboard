import { useState } from "react";
import PageLayout from "../layouts/PageLayout";
import FilterTabs from "../components/ui/FilterTabs";
import ProjectCard from "../components/ui/ProjectCard";
import { getAllProjects } from "../lib/projectSelectors";
import { GRID, SPACING, TYPOGRAPHY } from "../config/constants";

/**
 * Projects page — filterable, sorted grid of project cards.
 * Owns the filter state and drives the controlled FilterTabs.
 */
const Projects = () => {
  const [filter, setFilter] = useState("all");

  // Derive the visible list from state — never store it.
  // .filter() returns a fresh array, so the following .sort() (newest first)
  // does not mutate the source data.
  const visibleProjects = getAllProjects()
    .filter((project) => filter === "all" || project.status === filter)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return (
    <PageLayout title="Projects" subtitle="Browse and manage your projects">
      {/* ── Status filter ── */}
      <FilterTabs filter={filter} onChange={setFilter} />

      {/* ── Results — grid, or an empty-state message ── */}
      {visibleProjects.length === 0 ? (
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-6`}>
          No projects found.
        </p>
      ) : (
        <div className={`${GRID.PROJECTS} ${SPACING.GAP_4} mt-6`}>
          {visibleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </PageLayout>
  );
};

export default Projects;