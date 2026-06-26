import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GitHubCalendar } from "react-github-calendar";
import PageLayout from "../layouts/PageLayout";
import Card from "../components/ui/Card";
import FeedbackCard from "../components/ui/FeedbackCard";
import { fetchProjects } from "../services/api";
import { getFeedback } from "../services/api/feedback";
import { getStatusCounts } from "../lib/projectStats";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { FEEDBACK_STATUSES } from "../config/feedbackStatus";
import { GITHUB_USERNAME } from "../config/github";
import { GRID, SPACING, TYPOGRAPHY } from "../config/constants";

/** How many feedback items to pull for the dashboard overview. */
const FEEDBACK_LIMIT = 100;

/**
 * Dashboard page — overview of projects and activity.
 * Project stat values are derived live from the fetched project list. Admins
 * additionally see recent feedback grouped by status; the feedback list API is
 * admin-only, so it's neither fetched nor shown to visitors.
 */
const Dashboard = () => {
  const { isAdmin } = useAuth();
  // Drives the contribution calendar's color scheme so it tracks the app theme.
  const { theme } = useTheme();

  // ── Project stats lifecycle ──
  const [counts, setCounts] = useState({ total: 0, active: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Feedback lifecycle (admin-only; kept separate so a failure here never
  //    breaks the project stats above) ──
  const [feedback, setFeedback] = useState([]);
  const [fbLoading, setFbLoading] = useState(false);
  const [fbError, setFbError] = useState(null);

  // Fetch all projects once and reduce them to status counts.
  useEffect(() => {
    // A useEffect callback can't be async itself (it must return a cleanup
    // function, not a Promise), so the work lives in an inner async function.
    const loadCounts = async () => {
      console.log("[Dashboard] fetching projects for stat counts…");
      try {
        const projects = await fetchProjects();
        const next = getStatusCounts(projects);
        console.log("[Dashboard] counts:", next);
        setCounts(next);
      } catch (err) {
        console.error("[Dashboard] load failed:", err.message);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    loadCounts();
  }, []);

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

  // Each stat links to the Projects page, deep-linked to the matching filter.
  const STATS = [
    { id: 1, label: "Total Projects", value: counts.total, to: "/projects" },
    { id: 2, label: "Active", value: counts.active, to: "/projects?status=active" },
    { id: 3, label: "Completed", value: counts.completed, to: "/projects?status=completed" },
  ];

  return (
    <PageLayout
      title="Dashboard"
      subtitle="Overview of your projects and activity"
    >
      {/* ── Project stats — loading / error first, then the grid ── */}
      {loading ? (
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
          Loading dashboard…
        </p>
      ) : error ? (
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
          Couldn’t load dashboard: {error}
        </p>
      ) : (
        <div className={`${GRID.STATS} ${SPACING.GAP_4}`}>
          {STATS.map(({ id, label, value, to }) => (
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

      {/* ── GitHub activity — contribution calendar (visible to everyone) ── */}
      <section className="mt-10">
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
              blockMargin={6}
              blockRadius={1}
            />
          </div>
        </Card>
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
