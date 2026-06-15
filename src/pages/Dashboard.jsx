import PageLayout from "../layouts/PageLayout";
import Card from "../components/ui/Card";
import { getStatusCounts } from "../lib/projectSelectors";
import { GRID, SPACING, TYPOGRAPHY } from "../config/constants";

/**
 * Dashboard page — overview of projects and activity.
 * Stat values are derived live from the project data, so adding or removing
 * a project in projects.js updates these counts automatically.
 */
const Dashboard = () => {
  const counts = getStatusCounts();

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
      {/* ── Stats grid ── */}
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
    </PageLayout>
  );
};

export default Dashboard;