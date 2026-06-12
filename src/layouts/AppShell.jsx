import { useSidebar } from "../hooks/useSidebar";
import Sidebar from "../components/nav/Sidebar";
import TopBar from "../components/ui/TopBar";

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
        <div className="flex h-screen overflow-hidden bg-page-bg">

            {/* ── Sidebar wrapper — owns width and transition ── */}
            <div className={`
                shrink-0 h-full
                bg-sidebar-bg border-r border-border
                transition-all duration-300 ease-in-out
                ${isOpen ? "w-56" : "w-16"}
            `}>
                <Sidebar />
            </div>

            {/* ── Content column ── */}
            <div className="flex-1 min-w-0 flex flex-col">

                {/* ── TopBar strip (placeholder — replaced in Step 7) ── */}
                <div className="
                    h-12 shrink-0
                    bg-topbar-bg border-b border-border
                ">
                    <TopBar />
                </div>

                {/* ── Scrollable main area ── */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>

            </div>

        </div>
    );
};

export default AppShell;