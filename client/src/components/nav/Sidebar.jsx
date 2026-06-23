import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebar } from "../../hooks/useSidebar";
import { useAuth } from "../../hooks/useAuth";
import NavItem from "./NavItem";
import ThemeToggle from "../ui/ThemeToggle";
import ProfileMenu from "../ui/ProfileMenu";
import navItems from "../../config/navItems";
import {
  HEIGHT,
  SPACING,
  ROUNDED,
  TRANSITION,
  FLEX,
  SIZING,
  WIDTH,
  BORDER,
  A11Y,
  ICON_SIZE,
} from "../../config/constants";

/**
 * Sidebar navigation panel.
 * Renders collapse toggle, nav item list, and a reserved bottom section.
 * On mobile, closes itself after a nav item is tapped.
 */
const Sidebar = () => {
  const { isOpen, toggle } = useSidebar();
  const { isAdmin } = useAuth();

  // Hide admin-only links (e.g. Report) from visitors.
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  /**
   * Close the drawer after navigation on mobile only.
   * On desktop the sidebar stays open, so we leave it alone.
   */
  const handleNavClick = () => {
    if (window.innerWidth < 768 && isOpen) {
      toggle();
    }
  };

  return (
    <aside className={`${FLEX.ROW} ${FLEX.COL} ${HEIGHT.FULL} ${WIDTH.FULL}`}>
      {/* ── Collapse toggle button ── */}
      <div
        className={`${FLEX.CENTER} ${HEIGHT.SIDEBAR_TOGGLE} ${FLEX.SHRINK_0} ${BORDER.BOTTOM} ${SPACING.PX_3}`}
      >
        <button
          onClick={toggle}
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          className={`
                        ${FLEX.CENTER_JUSTIFY}
                        ${WIDTH.ICON_BUTTON} ${HEIGHT.ICON_BUTTON} ${ROUNDED.MD}
                        text-text-secondary
                        hover:bg-accent-subtle hover:text-accent
                        ${TRANSITION.COLORS} ${A11Y.FOCUS_RING}
                        ${SPACING.ML_AUTO}
                    `}
        >
          {isOpen ? (
            <ChevronLeft size={ICON_SIZE.SM} />
          ) : (
            <ChevronRight size={ICON_SIZE.SM} />
          )}
        </button>
      </div>

      {/* ── Nav items list ── */}
      <nav
        className={`${FLEX.FLEX_1} ${SPACING.PY_4} ${SIZING.OVERFLOW_Y_AUTO}`}
        onClick={handleNavClick}
      >
        {visibleNavItems.map(({ id, icon, label, path, end }) => (
          <NavItem
            key={id}
            icon={icon}
            label={label}
            path={path}
            end={end}
            isOpen={isOpen}
          />
        ))}
      </nav>

      {/* ── Bottom section — theme toggle + account / sign-in control ──
         Expanded: a single row. Collapsed (w-16): icons stacked and centered. */}
      <div
        className={`${FLEX.SHRINK_0} ${BORDER.TOP} ${SPACING.PY_3} ${SPACING.PX_3}`}
      >
        <div
          className={
            isOpen
              ? `${FLEX.CENTER} ${FLEX.JUSTIFY_BETWEEN} ${SPACING.GAP_2}`
              : `${FLEX.ROW} ${FLEX.COL} ${FLEX.CENTER_JUSTIFY} ${SPACING.GAP_2}`
          }
        >
          <ThemeToggle compact={!isOpen} />
          <ProfileMenu compact={!isOpen} placement="sidebar" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
