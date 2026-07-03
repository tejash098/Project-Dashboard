import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import GitHubIcon from "@mui/icons-material/GitHub";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import PageLayout from "../layouts/PageLayout";
import FilterTabs from "../components/ui/FilterTabs";
import RepoCard from "../components/ui/RepoCard";
import { fetchGitHubRepos } from "../services/api/github";
import { getLanguageCounts, NO_LANGUAGE } from "../lib/languageStats";
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
 * GitHub REST API, filterable by primary language via `?lang=` so a filtered
 * view can be deep-linked. Follows the same loading / error / empty lifecycle
 * as the Projects page. Each card links out to its repo on github.com.
 */
const GitHub = () => {
  // Filter lives in the URL: read it from `?lang=`, write it on chip change.
  const [searchParams, setSearchParams] = useSearchParams();
  const rawLang = searchParams.get("lang");

  /** Update the `?lang=` query param ("all" drops it for a clean URL). */
  const setFilter = (value) => {
    setSearchParams(value === "all" ? {} : { lang: value }, { replace: true });
  };

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

  // Counts come from the full fetched list, not the filtered view, so the
  // chips always show accurate totals. `total` feeds the "All" chip.
  const counts = getLanguageCounts(repos);

  // Chip set: "All", then languages by frequency (ties alphabetical), then a
  // "No language" chip only when some repo has no detected language.
  const languages = Object.keys(counts)
    .filter((key) => key !== "total" && key !== NO_LANGUAGE)
    .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
  const langFilters = [
    { value: "all", label: "All" },
    ...languages.map((lang) => ({ value: lang, label: lang })),
    ...(counts[NO_LANGUAGE]
      ? [{ value: NO_LANGUAGE, label: "No language" }]
      : []),
  ];

  // Unknown/stale `?lang=` values coerce to "all" at render time — never by
  // rewriting the URL, which would clobber a valid deep link while the valid
  // set is still empty during loading.
  const filter =
    rawLang && (languages.includes(rawLang) || rawLang === NO_LANGUAGE)
      ? rawLang
      : "all";

  // Derive the visible list from state — never store it. API order is already
  // newest-updated first, so no re-sort is needed.
  const visibleRepos = repos.filter(
    (repo) =>
      filter === "all" ||
      (filter === NO_LANGUAGE
        ? repo.language === null
        : repo.language === filter),
  );

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
      {/* ── Loading / error first, then the language chips + repo grid ── */}
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
        <>
          {/* Language filter chips — stay visible even when the current
              filter matches nothing, so the user can switch back. */}
          <div className="mt-6">
            <FilterTabs
              filter={filter}
              onChange={setFilter}
              filters={langFilters}
              counts={counts}
            />
          </div>

          {visibleRepos.length === 0 ? (
            <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-6`}>
              No repositories found.
            </p>
          ) : (
            <div className={`${GRID.PROJECTS} ${SPACING.GAP_4} mt-6`}>
              {visibleRepos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
};

export default GitHub;
