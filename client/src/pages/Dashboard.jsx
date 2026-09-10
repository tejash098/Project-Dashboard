import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { GitHubCalendar } from "react-github-calendar";
import PageLayout from "../layouts/PageLayout";
import Card from "../components/ui/Card";
import DownloadCvButton from "../components/ui/DownloadCvButton";
import FeedbackCard from "../components/ui/FeedbackCard";
import LanguageDonutChart from "../components/ui/LanguageDonutChart";
import { fetchProjects } from "../services/api";
import { getFeedback } from "../services/api/feedback";
import { getStatusCounts } from "../lib/projectStats";
import { useAuth } from "../hooks/useAuth";
import { useGitHubStats } from "../hooks/useGitHubStats";
import { useLanguageStats } from "../hooks/useLanguageStats";
import { useTheme } from "../hooks/useTheme";
import { FEEDBACK_STATUSES } from "../config/feedbackStatus";
import { GITHUB_STATS_FALLBACK, GITHUB_USERNAME } from "../config/github";
import { FULL_NAME, INTEGRATIONS, INTERNSHIPS, TAGLINE } from "../config/profile";
import {
  A11Y,
  GRID,
  HERO,
  ICON_SIZE,
  ROUNDED,
  SPACING,
  TYPOGRAPHY,
} from "../config/constants";

/** How many feedback items to pull for the dashboard overview. */
const FEEDBACK_LIMIT = 100;

/**
 * Anchor id of the GitHub Activity section — the contributions tile jumps
 * here so the headline number lands on the heatmap that backs it up.
 */
const ACTIVITY_SECTION_ID = "github-activity";

/**
 * One landing-page stat tile: a headline number, what it counts, and a
 * sub-label that makes the claim verifiable at a glance. Every tile links to
 * its evidence — `href` for an in-page anchor, `to` for a route.
 *
 * Module-scope so React sees one stable component type across renders (the
 * `react-hooks/static-components` rule), matching About's local helpers.
 * @param {Object} props
 * @param {number} props.value - The headline number.
 * @param {string} props.label - What the number counts.
 * @param {string} props.sublabel - Where the number comes from.
 * @param {string} [props.to] - Router path the tile links to.
 * @param {string} [props.href] - In-page `#anchor` the tile links to. Must be
 *   a native anchor: a router `Link` to a hash only pushes history and never
 *   scrolls the overflow `<main>` — fragment navigation does.
 */
const StatTile = ({ value, label, sublabel, to, href }) => {
  const card = (
    <Card className="h-full hover:border-accent">
      <p
        className={`${TYPOGRAPHY.TEXT_2XL} ${TYPOGRAPHY.FONT_BOLD} text-text-primary tabular-nums`}
      >
        {value}
      </p>
      <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>{label}</p>
      <p className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary ${SPACING.MT_1}`}>
        {sublabel}
      </p>
    </Card>
  );
  return href ? (
    <a href={href} className="block">
      {card}
    </a>
  ) : (
    <Link to={to} className="block">
      {card}
    </Link>
  );
};

/**
 * Landing page — a hero (name, pitch, View work / Download CV) followed by
 * four stat tiles, the GitHub contribution calendar, the language donut, and
 * project status counts (total / active / completed) that deep-link into the
 * filtered catalogue. The two GitHub numbers are fetched live and fall back
 * to a dated snapshot; the career numbers are static config.
 * Admins additionally see recent feedback grouped by status; the feedback
 * list API is admin-only, so it's neither fetched nor shown to visitors.
 */
const Dashboard = () => {
  const { isAdmin } = useAuth();
  // Drives the contribution calendar's color scheme so it tracks the app theme.
  const { theme } = useTheme();

  // ── Live GitHub numbers for the stat tiles (null until loaded / on failure) ──
  const { contributions, repoCount } = useGitHubStats(GITHUB_USERNAME);

  // ── Feedback lifecycle (admin-only; kept separate so a failure here never
  //    breaks the rest of the page) ──
  const [feedback, setFeedback] = useState([]);
  const [fbLoading, setFbLoading] = useState(false);
  const [fbError, setFbError] = useState(null);

  // ── Language stats lifecycle (same isolation rationale — a GitHub API
  //    failure never breaks the tiles; served from a 24h cache) ──
  const {
    totals: langTotals,
    loading: langLoading,
    error: langError,
  } = useLanguageStats(GITHUB_USERNAME);

  // ── Project status counts lifecycle (public; isolated like the others) ──
  const [projects, setProjects] = useState([]);
  const [projLoading, setProjLoading] = useState(true);
  const [projError, setProjError] = useState(null);

  // Load the project list once on mount and reduce it to counts below — the
  // same call and reducer the Projects page uses for its filter tabs, so the
  // two pages can never disagree about the numbers.
  useEffect(() => {
    let ignore = false;
    (async () => {
      console.log("[Dashboard] fetching projects for status counts…");
      try {
        const list = await fetchProjects();
        console.log(`[Dashboard] loaded ${list.length} projects`);
        if (!ignore) setProjects(list);
      } catch (err) {
        console.error("[Dashboard] projects load failed:", err.message);
        if (!ignore) setProjError(err.response?.data?.message || err.message);
      } finally {
        if (!ignore) setProjLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // Each count links to the Projects page, deep-linked to the matching filter.
  const counts = getStatusCounts(projects);
  const PROJECT_STATS = [
    { id: "total", label: "Total Projects", value: counts.total, to: "/projects" },
    { id: "active", label: "Active", value: counts.active, to: "/projects?status=active" },
    { id: "completed", label: "Completed", value: counts.completed, to: "/projects?status=completed" },
  ];

  // Fetch feedback only for admins. Skipping the call for visitors avoids a 401
  // → auto-logout (the endpoint requires a token).
  useEffect(() => {
    let ignore = false;
    (async () => {
      // All state updates live inside the async fn (not the effect body) to
      // satisfy the lint rule about synchronous setState in effects.
      if (!isAdmin) {
        setFeedback([]);
        return;
      }
      setFbLoading(true);
      setFbError(null);
      console.log("[Dashboard] fetching feedback for admin overview…");
      try {
        const res = await getFeedback({ limit: FEEDBACK_LIMIT });
        if (!ignore) setFeedback(res.data);
      } catch (err) {
        if (!ignore) setFbError(err.response?.data?.message || err.message);
      } finally {
        if (!ignore) setFbLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [isAdmin]);

  // Each tile links to the page (or section) that substantiates its number.
  // `??` on the live values: null means the fetch is pending or failed, so the
  // dated snapshot shows instead — never a spinner or an error in a stat tile.
  const STATS = [
    {
      id: "contributions",
      value: contributions ?? GITHUB_STATS_FALLBACK.contributions,
      label: "Contributions",
      sublabel: "GitHub, last 12 months",
      href: `#${ACTIVITY_SECTION_ID}`,
    },
    {
      id: "repos",
      value: repoCount ?? GITHUB_STATS_FALLBACK.repoCount,
      label: "Public repositories",
      sublabel: "Original work, forks excluded",
      to: "/github",
    },
    {
      id: "integrations",
      value: INTEGRATIONS.count,
      label: "Production integrations",
      sublabel: INTEGRATIONS.label,
      to: "/about",
    },
    {
      id: "internships",
      value: INTERNSHIPS.count,
      label: "Internships",
      sublabel: INTERNSHIPS.label,
      to: "/about",
    },
  ];

  return (
    // No title/subtitle: the hero below is the page heading.
    <PageLayout>
      {/* ── Hero — name, one-line pitch, and the two calls to action ── */}
      <section aria-labelledby="hero-heading">
        <h1 id="hero-heading" className={`${HERO.TITLE} text-text-primary`}>
          {FULL_NAME}
        </h1>
        <p className={`${HERO.TAGLINE} text-text-secondary mt-3`}>{TAGLINE}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/* Primary — same accent-filled idiom as the app's other primary
              buttons; py-1.5 matches the outlined CV button's height. */}
          <Link
            to="/projects"
            className={`inline-flex items-center gap-1 ${ROUNDED.MD} bg-accent px-3 py-1.5
              ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-white hover:opacity-90
              ${A11Y.FOCUS_RING}`}
          >
            View work
            <ArrowRight size={ICON_SIZE.SM} aria-hidden="true" />
          </Link>
          <DownloadCvButton />
        </div>
      </section>

      {/* ── Stats — four tiles, each linking to its evidence ── */}
      <div className={`${GRID.STATS} ${SPACING.GAP_4} mt-8`}>
        {STATS.map(({ id, ...tile }) => (
          <StatTile key={id} {...tile} />
        ))}
      </div>

      {/* ── GitHub activity — contribution calendar (visible to everyone).
          Anchored so the contributions tile can scroll here; scroll-mt-6
          offsets the scrolling main element's p-6 padding. ── */}
      <section id={ACTIVITY_SECTION_ID} className="mt-10 scroll-mt-6">
        <h2
          className={`${TYPOGRAPHY.TEXT_2XL} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary mb-4`}
        >
          GitHub Activity
        </h2>
        <Card>
          {/* Horizontal scroll keeps the full-year heatmap usable on narrow
              screens instead of overflowing the card. */}
          <div className="overflow-x-auto">
            <GitHubCalendar
              username={GITHUB_USERNAME}
              colorScheme={theme}
              fontSize={12}
              // Shown in place of the heatmap when the contributions API can't
              // be reached, instead of the library's default unstyled error.
              errorMessage="Couldn`t load GitHub activity right now. Please try again later."
              // Label only Mon/Wed/Fri on the left, mirroring GitHub's own
              // contribution graph instead of listing all seven weekdays.
              showWeekdayLabels={["mon", "tue", "wed", "thu", "fri", "sat", "sun"]}
              blockMargin={6}
              blockRadius={1}
            />
          </div>
        </Card>
      </section>

      {/* ── Languages — donut of code bytes per language across public repos.
          Notebooks are excluded client-side (see lib/languageStats.js) so
          notebook JSON doesn't drown the actual code. ── */}
      <section className="mt-10">
        <h2
          className={`${TYPOGRAPHY.TEXT_2XL} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary mb-4`}
        >
          Languages
        </h2>
        <Card>
          {langLoading ? (
            <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
              Loading language stats…
            </p>
          ) : langError ? (
            <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
              Couldn’t load language stats: {langError}
            </p>
          ) : !langTotals || Object.keys(langTotals).length === 0 ? (
            <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
              No language data available.
            </p>
          ) : (
            <LanguageDonutChart totals={langTotals} />
          )}
        </Card>
      </section>

      {/* ── Projects — status counts, each tile deep-linking into the catalogue ── */}
      <section className="mt-10">
        <h2
          className={`${TYPOGRAPHY.TEXT_2XL} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary mb-4`}
        >
          Projects
        </h2>

        {projLoading ? (
          <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
            Loading projects…
          </p>
        ) : projError ? (
          <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
            Couldn’t load projects: {projError}
          </p>
        ) : (
          // Label over number — the catalogue's own summary shape, distinct
          // from the number-first hero tiles above.
          <div className={`${GRID.PROJECT_STATS} ${SPACING.GAP_4}`}>
            {PROJECT_STATS.map(({ id, label, value, to }) => (
              <Link key={id} to={to} className="block">
                <Card className="h-full hover:border-accent">
                  <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
                    {label}
                  </p>
                  <p
                    className={`${TYPOGRAPHY.TEXT_2XL} ${TYPOGRAPHY.FONT_BOLD} text-text-primary ${SPACING.MT_2}`}
                  >
                    {value}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Feedback (admin-only) — cards grouped by status ── */}
      {isAdmin && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`${TYPOGRAPHY.TEXT_2XL} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}
            >
              Feedback
            </h2>
            <Link
              to="/report"
              className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM}
                text-accent hover:underline`}
            >
              View all
            </Link>
          </div>

          {fbLoading ? (
            <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
              Loading feedback…
            </p>
          ) : fbError ? (
            <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
              Couldn’t load feedback: {fbError}
            </p>
          ) : (
            // One sub-section per status, each a grid of feedback cards.
            FEEDBACK_STATUSES.map(({ value, label }) => {
              const group = feedback.filter((f) => f.status === value);
              return (
                <div key={value} className="mt-6 first:mt-0">
                  <h3
                    className={`${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary mb-3`}
                  >
                    {label} ({group.length})
                  </h3>
                  {group.length === 0 ? (
                    <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
                      No {label.toLowerCase()} feedback.
                    </p>
                  ) : (
                    <div className={`${GRID.PROJECTS} ${SPACING.GAP_4}`}>
                      {group.map((f) => (
                        <FeedbackCard key={f.f_id} feedback={f} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      )}
    </PageLayout>
  );
};

export default Dashboard;
