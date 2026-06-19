import { useParams } from "react-router-dom";
import LaunchIcon from "@mui/icons-material/Launch";
import GitHubIcon from "@mui/icons-material/GitHub";
import PageLayout from "../layouts/PageLayout";
import BackLink from "../components/ui/BackLink";
import StatusBadge from "../components/ui/StatusBadge";
import { getProjectById } from "../lib/projectSelectors";
import { formatDate } from "../lib/formatters";
import {
  CONTAINER,
  ICON_SIZE,
  ROUNDED,
  SPACING,
  TYPOGRAPHY,
} from "../config/constants";

/**
 * Project detail page — full record for a single project, looked up by the
 * `:id` route slug. Renders a not-found state when the slug doesn't match.
 */
const ProjectDetail = () => {
  const { id } = useParams();
  const project = getProjectById(id);

  // ── Not found — the slug matched no project ──
  if (!project) {
    return (
      <PageLayout title="Project Not Found">
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary ${SPACING.MB_6}`}>
          Project Not Found. Go back to the Project List and Select existing one.
        </p>
        <BackLink />
      </PageLayout>
    );
  }

  const {
    title,
    description,
    status,
    techStack,
    tags,
    liveUrl,
    repoUrl,
    createdAt,
    updatedAt,
  } = project;

  return (
    <>
      {/* ── Back link — sits above the page title, same width as content ── */}
      <div className={`${CONTAINER.MAX_W} mb-4`}>
        <BackLink />
      </div>

      <PageLayout title={title} actions={<StatusBadge status={status} />}>
        {/* ── Full description — no clamp here ── */}
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-primary`}>{description}</p>

        {/* ── Tech stack — bordered neutral chips ── */}
        <div className={SPACING.MT_2}>
          <h2 className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-secondary mb-2`}>
            Tech Stack
          </h2>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <span
                key={tech}
                className={`${ROUNDED.MD} border border-border px-2 py-0.5
                  ${TYPOGRAPHY.TEXT_XS} text-text-secondary`}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* ── Tags — muted #-prefixed pills ── */}
        <div className="mt-5">
          <h2 className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-secondary mb-2`}>
            Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className={`${ROUNDED.FULL} bg-page-bg px-2 py-0.5
                  ${TYPOGRAPHY.TEXT_XS} text-text-secondary`}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Links — external, open in a new tab; Live only when present ── */}
        <div className="flex items-center gap-4 mt-5">
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 ${TYPOGRAPHY.TEXT_SM}
                ${TYPOGRAPHY.FONT_MEDIUM} text-accent hover:underline`}
            >
              <LaunchIcon sx={{ fontSize: ICON_SIZE.SM }} />
              Live
            </a>
          )}
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 ${TYPOGRAPHY.TEXT_SM}
              ${TYPOGRAPHY.FONT_MEDIUM} text-accent hover:underline`}
          >
            <GitHubIcon sx={{ fontSize: ICON_SIZE.SM }} />
            Code
          </a>
        </div>

        {/* ── Dates — created / last updated ── */}
        <p className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary mt-5`}>
          Created {formatDate(createdAt)} · Updated {formatDate(updatedAt)}
        </p>
      </PageLayout>
    </>
  );
};

export default ProjectDetail;
