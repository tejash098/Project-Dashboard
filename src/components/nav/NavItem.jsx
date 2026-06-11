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
const NavItem = ({ icon: Icon, label, path, isOpen }) => {
    return (
        <a href={path} title={!isOpen ? label : undefined}
        className= {`flex items-center gap-3
            px-3 py-2.5 mx-2 rounded-lg text-text-secondary
            hover:bg-accent-subtle hover:text-accent
            transition-colors duration-200 cursor-pointer`}
        >
            {/* ── Icon — always visible ── */}
            <span className="shrink-0">
                <Icon sx={{ fontSize: 20 }} />
            </span>

            {/* ── Label — only visible when expanded ── */}
            {isOpen && (
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                    {label}
                </span>
            )}
        </a>
    );
};

export default NavItem;