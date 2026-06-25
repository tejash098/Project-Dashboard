import { useEffect, useState } from "react";
import PageLayout from "../layouts/PageLayout";
import RepoCard from "../components/ui/RepoCard";
import { fetchGitHubRepos } from "../services/api/github";
import { GITHUB_USERNAME } from "../config/github";
import { GRID, SPACING, TYPOGRAPHY } from "../config/constants";

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
    <PageLayout title="GitHub" subtitle="My public repositories">
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
