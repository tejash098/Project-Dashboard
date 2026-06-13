import ThemeToggle from "./ThemeToggle";
import {
  HEIGHT,
  SPACING,
  TRANSITION,
  TYPOGRAPHY,
  ROUNDED,
  FLEX,
  SIZING,
  BORDER,
  A11Y,
} from "../../config/constants";
import { useLocation } from "react-router-dom";
import navItems from "../../config/navItems";
import MenuIcon from "@mui/icons-material/Menu";
import { useSidebar } from "../../hooks/useSidebar";

/**
 * Top navigation bar — spans the content column.
 * Left: mobile hamburger + page title. Center: spacer. Right: action buttons.
 */
const TopBar = () => {
  const location = useLocation();
  const currentPage =
    navItems.find((item) => item.path === location.pathname)?.label ??
    "Dashboard";

  const { toggle: toggleSidebar } = useSidebar();

  return (
    <header
      className={`
                ${HEIGHT.TOPBAR} ${FLEX.SHRINK_0}
                ${FLEX.CENTER} ${SPACING.PX_6}
                bg-topbar-bg ${BORDER.BOTTOM}
                ${TRANSITION.COLORS_SLOW}
            `}
    >
      {/* ── Hamburger — mobile only ── */}
      <button
        onClick={toggleSidebar}
        aria-label="Open menu"
        className={`
                    md:hidden
                    ${FLEX.CENTER} ${SPACING.MR_4}
                    p-2 ${ROUNDED.MD}
                    text-text-secondary
                    hover:bg-accent-subtle hover:text-accent
                    ${TRANSITION.COLORS} ${A11Y.FOCUS_RING}
                `}
      >
        <MenuIcon sx={{ fontSize: 22 }} />
      </button>

      {/* ── Page title ── */}
      <div
        className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}
      >
        {currentPage}
      </div>

      {/* ── Center — grows to push zones apart ── */}
      <div className={FLEX.FLEX_1} />

      {/* ── Right — action buttons ── */}
      <div className={`${FLEX.CENTER} ${SPACING.GAP_2}`}>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default TopBar;
