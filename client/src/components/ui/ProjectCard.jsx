import { Link } from "react-router-dom";
import LaunchIcon from "@mui/icons-material/Launch";
import GitHubIcon from "@mui/icons-material/GitHub";
import Card from "./Card";
import StatusBadge from "./StatusBadge";
import { ICON_SIZE, ROUNDED, TYPOGRAPHY } from "../../config/constants";

/** @typedef {import("../../services/api").Project} Project */

/**
 * Card summarizing a single project. Composes the base Card.
 *
 * The card itself is intentionally NOT a wrapping link: only the title is an
 * internal Router Link to the detail page, which keeps the external Live/Code
 * anchors from becoming invalid nested interactive elements.
 *
 * @param {Object}  props
 * @param {Project} props.project - Project to render.
 */
const ProjectCard = ({ project }) => {
  const { slug, title, description, status, techStack, tags, liveUrl, repoUrl } =
    project;

  return (
    <Card>
      {/* ── Top row — title (links to detail) + status pill ── */}
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/projects/${slug}`}
          className={`${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary
            hover:text-accent transition-colors duration-200`}
        >
          {title}
        </Link>
        <StatusBadge status={status} />
      </div>

      {/* ── Description — clamped to two lines ── */}
      <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-2 line-clamp-2`}>
        {description}
      </p>

      {/* ── Tech stack — neutral chips, distinct from the status pill ── */}
      <div className="flex flex-wrap gap-2 mt-3">
        {techStack?.map((tech) => (
          <span
            key={tech}
            className={`${ROUNDED.MD} border border-border px-2 py-0.5
              ${TYPOGRAPHY.TEXT_XS} text-text-secondary`}
          >
            {tech}
          </span>
        ))}
      </div>

      {/* ── Tags — freeform categories, muted #-prefixed pills ── */}
      <div className="flex flex-wrap gap-2 mt-3">
        {tags?.map((tag) => (
          <span
            key={tag}
            className={`${ROUNDED.FULL} bg-page-bg px-2 py-0.5
              ${TYPOGRAPHY.TEXT_XS} text-text-secondary`}
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* ── Links — external, open in a new tab; Live only when present ── */}
      <div className="flex items-center gap-4 mt-4">
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
    </Card>
  );
};

export default ProjectCard;