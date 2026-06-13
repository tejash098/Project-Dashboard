import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebar } from "../../hooks/useSidebar";
import NavItem from "./NavItem";
import navItems from "../../config/navItems";
import { HEIGHT, SPACING, ROUNDED, TRANSITION, TYPOGRAPHY, FLEX, SIZING, WIDTH, BORDER } from "../../config/constants";

/**
 * Sidebar navigation panel.
 * Renders collapse toggle, nav item list, and a reserved bottom section.
 * Width and transition are controlled by the parent AppShell wrapper.
 */
const Sidebar = () => {
    const { isOpen, toggle } = useSidebar();

    return (
        <aside className={`${FLEX.ROW} ${FLEX.COL} ${HEIGHT.FULL} ${WIDTH.FULL}`}>

            {/* ── Collapse toggle button ── */}
            <div className={`${FLEX.CENTER} ${HEIGHT.SIDEBAR_TOGGLE} ${FLEX.SHRINK_0} ${BORDER.BOTTOM} ${SPACING.PX_3}`}>
                <button
                    onClick={toggle}
                    title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
                    className={`
                        ${FLEX.CENTER_JUSTIFY}
                        ${WIDTH.ICON_BUTTON} ${HEIGHT.ICON_BUTTON} ${ROUNDED.MD}
                        text-text-secondary
                        hover:bg-accent-subtle hover:text-accent
                        ${TRANSITION.COLORS}
                        ${SPACING.ML_AUTO}
                    `}
                >
                    {isOpen
                        ? <ChevronLeft size={18} />
                        : <ChevronRight size={18} />
                    }
                </button>
            </div>

            {/* ── Nav items list ── */}
            <nav className={`${FLEX.FLEX_1} ${SPACING.PY_4} ${SIZING.OVERFLOW_Y_AUTO}`}>
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
            <div className={`${FLEX.SHRINK_0} ${BORDER.TOP} ${SPACING.PY_3}`}>
                {isOpen && (
                    <p className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary ${SPACING.PX_5}`}>
                        Project Dashboard
                    </p>
                )}
            </div>

        </aside>
    );
};

export default Sidebar;