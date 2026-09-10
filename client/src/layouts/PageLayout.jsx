import { CONTAINER, FLEX, SPACING, TYPOGRAPHY } from "../config/constants";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

/**
 * Inner page wrapper providing consistent header and content spacing.
 * Renders an optional title, subtitle, and right-aligned actions slot, and
 * sets the browser-tab title for the route — every page renders through
 * here, so one hook call covers all of them.
 *
 * @param {React.ReactNode}  title    - Page heading displayed at the top. Usually a
 *   string; ProjectDetail passes an inline-editable element.
 * @param {string}           subtitle - Optional descriptive text below title.
 * @param {React.ReactNode}  actions  - Optional JSX rendered on header right.
 * @param {string}           documentTitle - Browser-tab title. Defaults to
 *   `title` when that is a string; pass explicitly when `title` is JSX. With
 *   neither, the tab shows just the owner's name (the landing page).
 * @param {React.ReactNode}  children - Page body content.
 */
const PageLayout = ({
  title,
  subtitle = null,
  actions = null,
  documentTitle,
  children,
}) => {
  // A JSX title would stringify to "[object Object]" — only strings qualify.
  useDocumentTitle(
    documentTitle ?? (typeof title === "string" ? title : undefined)
  );

  // The landing page brings its own hero, so it passes no header props at all
  // — skip the block entirely rather than leaving an empty, margined div.
  const hasHeader = Boolean(title || subtitle || actions);

  return (
    <div className={CONTAINER.MAX_W}>
      {/* ── Page header — title left, actions right ── */}
      {hasHeader && (
        <div
          className={`${FLEX.ROW} ${FLEX.ITEMS_START} ${FLEX.JUSTIFY_BETWEEN} ${SPACING.MB_6}`}
        >
          {/* Left — title + subtitle stacked */}
          <div>
            {title && (
              <h1
                className={`${TYPOGRAPHY.TEXT_2XL} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p
                className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary ${SPACING.MT_1}`}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Right — actions slot */}
          {actions && (
            <div className={`${FLEX.CENTER} ${SPACING.GAP_2}`}>{actions}</div>
          )}
        </div>
      )}

      {/* ── Page body — separate block below header ── */}
      <div className="text-text-secondary">{children}</div>
    </div>
  );
};

export default PageLayout;
