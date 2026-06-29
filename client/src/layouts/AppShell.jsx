import MenuIcon from "@mui/icons-material/Menu";
import { useSidebar } from "../hooks/useSidebar";
import Sidebar from "../components/nav/Sidebar";
import Logo from "../components/ui/Logo";
import FeedbackWidget from "../components/ui/FeedbackWidget";
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
          Mobile: fixed drawer (w-64), slides via translate-x.
         Keeps z-40 on desktop (not z-auto): the wrapper's translate-x creates a
         stacking context, so without a positive z-index the account popover's
         z-50 would be trapped below page content (e.g. Docs code blocks). z-40
         stays under the portaled modals/toasts (z-50), which still cover it. */}
      <div
        className={`
        h-full bg-sidebar-bg border-r border-border
        fixed top-0 left-0 z-40
        md:static md:shrink-0
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
            md:hidden ${FLEX.CENTER} ${FLEX.JUSTIFY_BETWEEN} ${FLEX.SHRINK_0}
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

          {/* Brand mark — always visible on mobile, links home. */}
          <Logo size={32} />
        </header>

        <main
          className={`${FLEX.FLEX_1} ${SIZING.OVERFLOW_Y_AUTO} ${APPSHELL.MAIN_PADDING}`}
        >
          {children}
        </main>
      </div>

      {/* ── Global feedback tab — fixed to the right edge on every page ── */}
      <FeedbackWidget />
    </div>
  );
};

export default AppShell;
