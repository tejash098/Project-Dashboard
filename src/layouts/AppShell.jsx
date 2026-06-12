import { useSidebar } from "../hooks/useSidebar";
import Sidebar from "../components/nav/Sidebar";
import TopBar from "../components/ui/TopBar";
import { SIDEBAR, TRANSITION, HEIGHT, SIZING, FLEX, APPSHELL } from "../config/constants";

/**
 * Master layout shell for the dashboard.
 * Owns sidebar width and transition — Sidebar fills the space,
 * AppShell controls how much space it gets.
 *
 * @param {React.ReactNode} children - Page content rendered inside main area.
 */
const AppShell = ({ children }) => {
    const { isOpen } = useSidebar();

    return (
        <div className={`
            ${FLEX.ROW} ${HEIGHT.SCREEN} ${SIZING.OVERFLOW_HIDDEN}
            bg-page-bg ${TRANSITION.COLORS_SLOW}
        `}>
            {/* ── Sidebar wrapper — owns width and transition ── */}
            <div className={`
                ${FLEX.SHRINK_0} ${HEIGHT.FULL}
                bg-sidebar-bg border-r border-border
                ${SIDEBAR.TRANSITION}
                ${isOpen ? SIDEBAR.EXPANDED_WIDTH : SIDEBAR.COLLAPSED_WIDTH}
            `}>
                <Sidebar />
            </div>

            {/* ── Content column ── */}
            <div className={`${FLEX.FLEX_1} ${FLEX.MIN_W_0} ${FLEX.ROW} ${FLEX.COL}`}>

                {/* ── TopBar ── */}
                <TopBar />

                {/* ── Scrollable main area ── */}
                <main className={`${FLEX.FLEX_1} ${SIZING.OVERFLOW_Y_AUTO} ${APPSHELL.MAIN_PADDING}`}>
                    {children}
                </main>

            </div>

        </div>
    );
};

export default AppShell;