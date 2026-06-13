import { CONTAINER, FLEX, SPACING, TYPOGRAPHY } from "../config/constants";

/**
 * Inner page wrapper providing consistent header and content spacing.
 * Renders an optional title, subtitle, and right-aligned actions slot.
 *
 * @param {string}           title    - Page heading displayed at the top.
 * @param {string}           subtitle - Optional descriptive text below title.
 * @param {React.ReactNode}  actions  - Optional JSX rendered on header right.
 * @param {React.ReactNode}  children - Page body content.
 */
const PageLayout = ({ title, subtitle = null, actions = null, children }) => {
  return (
    <div className={CONTAINER.MAX_W}>
      {/* ── Page header — title left, actions right ── */}
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

      {/* ── Page body — separate block below header ── */}
      <div className="text-text-secondary">{children}</div>
    </div>
  );
};

export default PageLayout;
