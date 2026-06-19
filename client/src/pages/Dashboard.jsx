import { useEffect, useState } from "react";
import PageLayout from "../layouts/PageLayout";
import Card from "../components/ui/Card";
import { fetchProjects } from "../services/api";
import { getStatusCounts } from "../lib/projectStats";
import { GRID, SPACING, TYPOGRAPHY } from "../config/constants";

/**
 * Dashboard page — overview of projects and activity.
 * Stat values are derived live from the fetched project list, so the counts
 * stay in sync with whatever the API returns.
 */
const Dashboard = () => {
  // ── Fetched data lifecycle ──
  const [counts, setCounts] = useState({ total: 0, active: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all projects once and reduce them to status counts.
  useEffect(() => {
    fetchProjects()
      .then((projects) => setCounts(getStatusCounts(projects)))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  const STATS = [
    { id: 1, label: "Total Projects", value: counts.total },
    { id: 2, label: "Active", value: counts.active },
    { id: 3, label: "Completed", value: counts.completed },
  ];

  return (
    <PageLayout
      title="Dashboard"
      subtitle="Overview of your projects and activity"
    >
      {/* ── Loading / error first, then the stats grid ── */}
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
          {STATS.map(({ id, label, value }) => (
            <Card key={id}>
              <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
                {label}
              </p>
              <p
                className={`${TYPOGRAPHY.TEXT_2XL} ${TYPOGRAPHY.FONT_BOLD} text-text-primary ${SPACING.MT_2}`}
              >
                {value}
              </p>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  );
};

export default Dashboard;
