import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebar } from "../../hooks/useSidebar";
import NavItem from "./NavItem";
import navItems from "../../config/navItems";

/**
 * Sidebar navigation panel.
 * Renders collapse toggle, nav item list, and a reserved bottom section.
 * Width and transition are controlled by the parent AppShell wrapper.
 */
const Sidebar = () => {
    const { isOpen, toggle } = useSidebar();

    return (
        <aside className="flex flex-col h-full w-full">

            {/* ── Collapse toggle button ── */}
            <div className="flex items-center h-12 shrink-0 border-b border-border px-3">
                <button
                    onClick={toggle}
                    title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
                    className="
                        flex items-center justify-center
                        w-8 h-8 rounded-lg
                        text-text-secondary
                        hover:bg-accent-subtle hover:text-accent
                        transition-colors duration-200
                        ml-auto
                    "
                >
                    {isOpen
                        ? <ChevronLeft size={18} />
                        : <ChevronRight size={18} />
                    }
                </button>
            </div>

            {/* ── Nav items list ── */}
            <nav className="flex-1 py-4 overflow-y-auto">
                {navItems.map(({ id, icon, label, path }) => (
                    <NavItem
                        key={id}
                        icon={icon}
                        label={label}
                        path={path}
                        isOpen={isOpen}
                    />
                ))}
            </nav>

            {/* ── Bottom section — reserved for user avatar / logout (later steps) ── */}
            <div className="shrink-0 border-t border-border py-3">
                {isOpen && (
                    <p className="text-xs text-text-secondary px-5">
                        Project Dashboard
                    </p>
                )}
            </div>

        </aside>
    );
};

export default Sidebar;