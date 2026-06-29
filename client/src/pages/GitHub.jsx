import { useEffect, useState } from "react";
import GitHubIcon from "@mui/icons-material/GitHub";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import PageLayout from "../layouts/PageLayout";
import RepoCard from "../components/ui/RepoCard";
import { fetchGitHubRepos } from "../services/api/github";
import {
  GITHUB_USERNAME,
  GITHUB_PROFILE_URL,
  GITHUB_REPOS_URL,
} from "../config/github";
import {
  GRID,
  SPACING,
  TYPOGRAPHY,
  ROUNDED,
  BORDER,
  A11Y,
  ICON_SIZE,
} from "../config/constants";

/** Outlined header-link styling — matches the docs "Copy page" button. */
const HEADER_LINK_CLASS = `inline-flex items-center gap-1.5 ${ROUNDED.MD} border ${BORDER.DEFAULT}
  px-3 py-1.5 ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary
  hover:bg-accent-subtle hover:text-accent ${A11Y.FOCUS_RING}`;

/**
 * GitHub page — a grid of the user's public repositories fetched live from the
 * GitHub REST API. Follows the same loading / error / empty lifecycle as the
 * Projects page. Each card links out to its repo on github.com.
 */
const GitHub = () => {
  // ── Fetched data lifecycle ──
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load the repo list once on mount.
  useEffect(() => {
    // Inner async function — the effect callback itself can't be async.
    const loadRepos = async () => {
      console.log("[GitHub] fetching repos…");
      try {
        const list = await fetchGitHubRepos(GITHUB_USERNAME);
        console.log(`[GitHub] loaded ${list.length} repos`);
        setRepos(list);
      } catch (err) {
        console.error("[GitHub] load failed:", err.message);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    loadRepos();
  }, []);

  return (
    <PageLayout
      title="GitHub"
      subtitle="My public repositories"
      actions={
        <>
          {/* Jump to the repositories tab on github.com (new tab). */}
          <a
            href={GITHUB_REPOS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={HEADER_LINK_CLASS}
          >
            <FolderOpenIcon sx={{ fontSize: ICON_SIZE.SM }} />
            Open repos
          </a>
          {/* Jump to the GitHub profile (new tab). */}
          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={HEADER_LINK_CLASS}
          >
            <GitHubIcon sx={{ fontSize: ICON_SIZE.SM }} />
            Open profile
          </a>
        </>
      }
    >
      {/* ── Loading / error first, then the repo grid ── */}
      {loading ? (
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-6`}>
          Loading repositories…
        </p>
      ) : error ? (
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-6`}>
          Couldn’t load repositories: {error}
        </p>
      ) : repos.length === 0 ? (
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-6`}>
          No repositories found.
        </p>
      ) : (
        <div className={`${GRID.PROJECTS} ${SPACING.GAP_4} mt-6`}>
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </PageLayout>
  );
};

export default GitHub;
