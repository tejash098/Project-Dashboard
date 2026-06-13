import PageLayout from "../layouts/PageLayout";
import Card from "../components/ui/Card";
import { GRID, SPACING, TYPOGRAPHY } from "../config/constants";

/**
 * Stat cards displayed on the dashboard overview.
 * Replace with fetched data when an API is connected.
 */
const STATS = [
  { id: 1, label: "Total Projects", value: "24", change: "+12%" },
  { id: 2, label: "Active Tasks", value: "147", change: "+8%" },
  { id: 3, label: "Completed", value: "1,284", change: "+23%" },
  { id: 4, label: "Team Members", value: "12", change: "+2" },
];

/**
 * Dashboard page — overview of projects and activity.
 */
const Dashboard = () => {
  return (
    <PageLayout
      title="Dashboard"
      subtitle="Overview of your projects and activity"
    >
      {/* ── Stats grid ── */}
      <div className={`${GRID.STATS} ${SPACING.GAP_4}`}>
        {STATS.map(({ id, label, value, change }) => (
          <Card key={id}>
            <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
              {label}
            </p>
            <p
              className={`${TYPOGRAPHY.TEXT_2XL} ${TYPOGRAPHY.FONT_BOLD} text-text-primary ${SPACING.MT_2}`}
            >
              {value}
            </p>
            <p className={`${TYPOGRAPHY.TEXT_XS} text-accent ${SPACING.MT_1}`}>
              {change}
            </p>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
};

export default Dashboard;
