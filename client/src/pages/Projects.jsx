import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageLayout from "../layouts/PageLayout";
import FilterTabs from "../components/ui/FilterTabs";
import ProjectCard from "../components/ui/ProjectCard";
import GatewayModal from "../components/ui/GatewayModal";
import LoginModal from "../components/ui/LoginModal";
import { fetchProjects } from "../services/api";
import { getStatusCounts } from "../lib/projectStats";
import { useAuth } from "../hooks/useAuth";
import { GRID, SPACING, TYPOGRAPHY } from "../config/constants";

/** Filter values that may be reflected in the `?status=` query param. */
const VALID_FILTERS = ["active", "completed"];

/**
 * Projects page — filterable, sorted grid of project cards fetched from the API.
 * The status filter is driven by the `?status=` query param so it can be
 * deep-linked (e.g. the Dashboard stat cards link straight to a filtered view).
 * On first visit (no view mode chosen yet) it prompts a visitor/admin gateway.
 */
const Projects = () => {
  // Filter lives in the URL: read it from `?status=`, write it on tab change.
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get("status");
  const filter = VALID_FILTERS.includes(rawStatus) ? rawStatus : "all";

  /** Update the `?status=` query param ("all" drops it for a clean URL). */
  const setFilter = (value) => {
    setSearchParams(value === "all" ? {} : { status: value }, { replace: true });
  };

  // ── View-mode gateway ──
  const { viewMode, setViewMode } = useAuth();
  // Open the gateway whenever the mode is still undecided for this session.
  const [gatewayOpen, setGatewayOpen] = useState(viewMode === null);
  const [loginOpen, setLoginOpen] = useState(false);

  /** Visitor path — browse read-only; records the choice so it won't re-prompt. */
  const handleVisitor = () => {
    console.log("[Projects] gateway → view as visitor");
    setViewMode("visitor");
    setGatewayOpen(false);
  };

  /** Admin path — fall back to visitor, then open login (success flips to admin). */
  const handleAdmin = () => {
    console.log("[Projects] gateway → view as admin (opening login)");
    setViewMode("visitor");
    setGatewayOpen(false);
    setLoginOpen(true);
  };

  /** Dismissed without choosing — treat as visitor so it won't nag again. */
  const handleGatewayClose = () => {
    console.log("[Projects] gateway dismissed → defaulting to visitor");
    setViewMode("visitor");
    setGatewayOpen(false);
  };

  // ── Fetched data lifecycle ──
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load the project list once on mount.
  useEffect(() => {
    // Inner async function — the effect callback itself can't be async.
    const loadProjects = async () => {
      console.log("[Projects] fetching project list…");
      try {
        const list = await fetchProjects();
        console.log(`[Projects] loaded ${list.length} projects`);
        setProjects(list);
      } catch (err) {
        console.error("[Projects] load failed:", err.message);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
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
    <>
      {/* ── View-mode gateway + login (overlays; rendered via portals) ── */}
      <GatewayModal
        open={gatewayOpen}
        onVisitor={handleVisitor}
        onAdmin={handleAdmin}
        onClose={handleGatewayClose}
      />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

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
    </>
  );
};

export default Projects;
