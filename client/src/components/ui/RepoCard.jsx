import StarIcon from "@mui/icons-material/Star";
import LaunchIcon from "@mui/icons-material/Launch";
import Card from "./Card";
import { getLanguageColor } from "../../config/languageColors";
import { formatDate } from "../../lib/formatters";
import { ICON_SIZE, TYPOGRAPHY } from "../../config/constants";

/** @typedef {import("../../services/api/github").GitHubRepo} GitHubRepo */

/**
 * Card summarizing a single GitHub repository. Composes the base Card and mirrors
 * the layout conventions of ProjectCard.
 *
 * The whole card is a single external link to the repo on github.com (opened in
 * a new tab) — there are no nested interactive elements, so wrapping is safe and
 * gives a large, obvious click target.
 *
 * @param {Object}     props
 * @param {GitHubRepo} props.repo - Repository to render.
 */
const RepoCard = ({ repo }) => {
  const { name, html_url, description, stargazers_count, language, updated_at } =
    repo;

  return (
    <a
      href={html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full"
    >
      <Card className="h-full hover:border-accent">
        {/* ── Top row — repo name + external-link affordance ── */}
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary
              break-all`}
          >
            {name}
          </h3>
          <LaunchIcon
            sx={{ fontSize: ICON_SIZE.SM }}
            className="text-text-secondary shrink-0"
          />
        </div>

        {/* ── Description — clamped to two lines; muted fallback when empty ── */}
        <p
          className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-2 line-clamp-2`}
        >
          {description || "No description"}
        </p>

        {/* ── Meta row — language, stars, last-updated ── */}
        <div
          className={`flex flex-wrap items-center gap-x-4 gap-y-1 mt-4
            ${TYPOGRAPHY.TEXT_XS} text-text-secondary`}
        >
          {/* Language — colored dot + name (hidden when GitHub reports none). */}
          {language && (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getLanguageColor(language) }}
              />
              {language}
            </span>
          )}

          {/* Stars */}
          <span className="inline-flex items-center gap-1">
            <StarIcon sx={{ fontSize: ICON_SIZE.SM }} />
            {stargazers_count}
          </span>

          {/* Last updated */}
          <span>Updated {formatDate(updated_at)}</span>
        </div>
      </Card>
    </a>
  );
};

export default RepoCard;
