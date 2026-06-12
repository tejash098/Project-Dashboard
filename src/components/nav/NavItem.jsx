/**
 * Single navigation link in the sidebar.
 * Renders icon always, label only when sidebar is expanded.
 * Provides a native tooltip when collapsed for accessibility.
 *
 * @param {React.ElementType} icon   - MUI icon component to render.
 * @param {string}            label  - Display name of the nav item.
 * @param {string}            path   - href target (swapped for NavLink in Step 8).
 * @param {boolean}           isOpen - Whether the sidebar is expanded.
 */
import { SPACING, ROUNDED, TRANSITION, TYPOGRAPHY, SIZING, FLEX } from "../../config/constants";

const NavItem = ({ icon: Icon, label, path, isOpen }) => {
    return (
        <a href={path} title={!isOpen ? label : undefined}
        className= {`${FLEX.CENTER} ${SPACING.GAP_3}
            ${SPACING.PX_3} ${SPACING.PY_2_5} ${SPACING.MX_2} ${ROUNDED.MD} text-text-secondary
            hover:bg-accent-subtle hover:text-accent
            ${TRANSITION.COLORS} ${SIZING.CURSOR_POINTER}`}
        >
            {/* ── Icon — always visible ── */}
            <span className={FLEX.SHRINK_0}>
                <Icon sx={{ fontSize: 20 }} />
            </span>

            {/* ── Label — only visible when expanded ── */}
            {isOpen && (
                <span className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} ${SIZING.WHITESPACE_NOWRAP} ${SIZING.OVERFLOW}`}>
                    {label}
                </span>
            )}
        </a>
    );
};

export default NavItem;