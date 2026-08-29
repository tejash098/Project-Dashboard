import { Link } from "react-router-dom";
import LaunchIcon from "@mui/icons-material/Launch";
import GitHubIcon from "@mui/icons-material/GitHub";
import Card from "./Card";
import StatusBadge from "./StatusBadge";
import LivePreview from "./LivePreview";
import { ICON_SIZE, ROUNDED, TYPOGRAPHY, A11Y } from "../../config/constants";

/** @typedef {import("../../services/api").Project} Project */

/**
 * Card summarizing a single project: a live preview of the deployment on the
 * left, the project's details on the right. Composes the base Card. Stacks to a
 * single column below `sm`, where a side-by-side split leaves neither half room.
 *
 * The whole card is clickable, but it is still NOT a wrapping link — nesting
 * the external Live/Code anchors inside one would be invalid. Instead the title
 * Link stretches its own hit area over the card (`after:inset-0`) while the
 * external anchors are lifted above it (`relative z-10`). That keeps exactly one
 * real anchor for the card, so keyboard, middle-click and screen readers all
 * behave without any role/tabIndex/keydown emulation. The preview tile carries
 * `pointer-events-none` (see PREVIEW.CARD_FRAME) so clicking the embedded site
 * navigates the card rather than interacting with the framed page.
 *
 * @param {Object}  props
 * @param {Project} props.project - Project to render.
 */
const ProjectCard = ({ project }) => {
  const { slug, title, description, status, techStack, tags, liveUrl, repoUrl } =
    project;

  return (
    // `group` + `relative` anchor the stretched link and drive the hover state.
    <div className="group relative cursor-pointer">
      <Card className="group-hover:border-accent group-focus-within:border-accent">
        <div className="flex flex-col gap-5 sm:flex-row">
          {/* ── Left — live preview of the deployment ── */}
          <div className="sm:w-2/5 lg:w-1/3 sm:shrink-0">
            <LivePreview url={liveUrl} title={title} compact />
          </div>

          {/* ── Right — the project's details ── */}
          <div className="flex-1 min-w-0">
            {/* Top row — title (stretches over the card) + status pill */}
            <div className="flex items-start justify-between gap-3">
              <Link
                to={`/projects/${slug}`}
                className={`${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary
                  hover:text-accent transition-colors duration-200 ${ROUNDED.SM}
                  ${A11Y.FOCUS_RING} after:absolute after:inset-0 after:content-['']`}
              >
                {title}
              </Link>
              <StatusBadge status={status} />
            </div>

            {/* Description — clamped so long summaries can't unbalance the row */}
            <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-2 line-clamp-3`}>
              {description}
            </p>

            {/* Tech stack — neutral chips, distinct from the status pill */}
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

            {/* Tags — freeform categories, muted #-prefixed pills */}
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

            {/* Links — external, open in a new tab; Live only when present.
                `relative z-10` lifts them above the title's stretched hit area
                so they stay independently clickable. */}
            <div className="relative z-10 flex items-center gap-4 mt-4 w-fit">
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
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProjectCard;
