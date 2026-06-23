import MenuIcon from "@mui/icons-material/Menu";
import { useSidebar } from "../hooks/useSidebar";
import Sidebar from "../components/nav/Sidebar";
import {
  TRANSITION,
  HEIGHT,
  SIZING,
  SPACING,
  FLEX,
  ROUNDED,
  BORDER,
  APPSHELL,
  Z_INDEX,
  A11Y,
} from "../config/constants";

/**
 * Master layout shell for the dashboard.
 * Desktop: sidebar is part of the layout flow, toggles wide/narrow.
 * Mobile: sidebar is a fixed drawer that slides over content with a backdrop.
 *
 * @param {React.ReactNode} children - Page content rendered inside main area.
 */
const AppShell = ({ children }) => {
  const { isOpen, toggle } = useSidebar();

  return (
    <div
      className={`
            ${FLEX.ROW} ${HEIGHT.SCREEN} ${SIZING.OVERFLOW_HIDDEN}
            bg-page-bg ${TRANSITION.COLORS_SLOW}
        `}
    >
      {/* ── Backdrop — mobile only, when drawer is open ── */}
      {isOpen && (
        <div
          onClick={toggle}
          aria-hidden="true"
          className={`
                        fixed inset-0 bg-black/50
                        ${Z_INDEX.BACKDROP} md:hidden
                        ${A11Y.MOTION_SAFE}
                    `}
        />
      )}

      {/* ── Sidebar wrapper ──
         Desktop: static, width toggles (w-56 / w-16).
          Mobile: fixed drawer (w-64), slides via translate-x. */}
      <div
        className={`
        h-full bg-sidebar-bg border-r border-border
        fixed top-0 left-0 z-40
        md:static md:z-auto md:shrink-0
        w-64
        transition-transform md:transition-all duration-300 ease-in-out
        motion-reduce:transition-none
        ${
          isOpen
            ? "translate-x-0 md:w-56"
            : "-translate-x-full md:translate-x-0 md:w-16"
        }
    `}
      >
        <Sidebar />
      </div>

      {/* ── Content column — main fills the remaining height ── */}
      <div className={`${FLEX.FLEX_1} ${FLEX.MIN_W_0} ${FLEX.ROW} ${FLEX.COL}`}>
        {/* ── Mobile-only top bar ──
           In-flow (not fixed) so it occupies its own space and never overlaps
           page headings; hidden on desktop where controls live in the sidebar. */}
        <header
          className={`
            md:hidden ${FLEX.CENTER} ${FLEX.SHRINK_0}
            ${HEIGHT.TOPBAR} ${SPACING.PX_3}
            bg-sidebar-bg ${BORDER.BOTTOM} ${TRANSITION.COLORS_SLOW}
          `}
        >
          <button
            onClick={toggle}
            aria-label="Open menu"
            className={`
              ${FLEX.CENTER_JUSTIFY} p-2 ${ROUNDED.MD}
              text-text-secondary
              hover:bg-accent-subtle hover:text-accent
              ${TRANSITION.COLORS} ${A11Y.FOCUS_RING}
            `}
          >
            <MenuIcon sx={{ fontSize: 22 }} />
          </button>
        </header>

        <main
          className={`${FLEX.FLEX_1} ${SIZING.OVERFLOW_Y_AUTO} ${APPSHELL.MAIN_PADDING}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
