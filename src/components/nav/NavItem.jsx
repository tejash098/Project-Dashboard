import { NavLink } from "react-router-dom";
import { ICON_SIZE, ROUNDED, TRANSITION, SPACING, FLEX, TYPOGRAPHY, SIZING } from "../../config/constants";

/**
 * Single navigation link in the sidebar.
 * Renders icon always, label only when sidebar is expanded.
 * Highlights automatically when route is active via NavLink.
 *
 * @param {React.ElementType} icon   - MUI icon component to render.
 * @param {string}            label  - Display name of the nav item.
 * @param {string}            path   - Route path passed to NavLink `to` prop.
 * @param {boolean}           isOpen - Whether the sidebar is expanded.
 */
const NavItem = ({ icon: Icon, label, path, isOpen }) => {
    return (
        <NavLink
            to={path}
            title={!isOpen ? label : undefined}
            className={({ isActive }) => `
                ${FLEX.CENTER} ${SPACING.GAP_3}
                ${SPACING.PX_3} ${SPACING.PY_2_5} ${SPACING.MX_2} ${ROUNDED.MD}
                ${isActive
                    ? "bg-accent-subtle text-accent"
                    : `text-text-secondary hover:bg-accent-subtle hover:text-accent ${TRANSITION.COLORS}`
                }
            `}
        >
            {/* ── Icon — always visible ── */}
            <span className={FLEX.SHRINK_0}>
                <Icon sx={{ fontSize: ICON_SIZE.MD }} />
            </span>

            {/* ── Label — only visible when expanded ── */}
            {isOpen && (
                <span className={`
                    ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM}
                    ${SIZING.WHITESPACE_NOWRAP} ${SIZING.OVERFLOW_HIDDEN}
                `}>
                    {label}
                </span>
            )}
        </NavLink>
    );
};

export default NavItem;