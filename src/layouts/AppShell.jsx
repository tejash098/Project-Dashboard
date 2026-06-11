import { useSidebar } from "../hooks/useSidebar";

/**
 * Master layout shell for the dashboard.
 * Renders sidebar strip, topbar strip, and scrollable main content area.
 *
 * @param {React.ReactNode} children - Page content rendered inside main area.
 */
const AppShell = ({ children }) => {
    const { isOpen } = useSidebar();

    return (
        <div className="flex h-screen overflow-hidden bg-page-bg">

            {/* ── Sidebar strip (placeholder — replaced in Step 6) ── */}
            <div className={`
                shrink-0 h-full
                bg-sidebar-bg border-r border-border
                transition-all duration-300 ease-in-out
                ${isOpen ? "w-56" : "w-16"}
            `}>
                {/* Sidebar component slots in here */}
            </div>

            {/* ── Content column ── */}
            <div className="flex-1 min-w-0 flex flex-col">

                {/* ── TopBar strip (placeholder — replaced in Step 7) ── */}
                <div className="
                    h-16 shrink-0
                    bg-topbar-bg border-b border-border
                ">
                    {/* TopBar component slots in here */}
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