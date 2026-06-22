import PageLayout from "../layouts/PageLayout";
import BackLink from "../components/ui/BackLink";
import { TYPOGRAPHY, SPACING } from "../config/constants";

/**
 * Global 404 page — rendered by the catch-all route when a URL matches no
 * defined route. Mirrors the project-not-found state for a consistent feel.
 */
const NotFound = () => {
  return (
    <PageLayout title="Page Not Found" subtitle="404 — this page doesn’t exist">
      {/* Explain the situation, then offer a way back to a known-good page. */}
      <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary ${SPACING.MB_6}`}>
        The page you’re looking for doesn’t exist or may have been moved.
      </p>
      <BackLink to="/" label="Back to dashboard" />
    </PageLayout>
  );
};

export default NotFound;
