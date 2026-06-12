import ThemeToggle from "./ThemeToggle";
import { HEIGHT, SPACING, TRANSITION, TYPOGRAPHY, FLEX, SIZING } from "../../config/constants";

/**
 * Top navigation bar — spans the content column.
 * Left zone: page title placeholder.
 * Center zone: flex-1 spacer (reserved for search).
 * Right zone: action buttons (theme toggle, future icons).
 */
const TopBar = () => {
    return (
        <header className={`
            ${HEIGHT.TOPBAR} ${SIZING.FLEX_SHRINK_0}
            ${FLEX.CENTER} ${SPACING.PX_6}
            bg-topbar-bg border-b border-border
            ${TRANSITION.COLORS_SLOW}
        `}>
            {/* ── Left — page title ── */}
            <div className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}>
                Dashboard
            </div>

            {/* ── Center — grows to push zones apart ── */}
            <div className={`${FLEX.FLEX_1}`} />

            {/* ── Right — action buttons ── */}
            <div className={`${FLEX.CENTER} ${SPACING.GAP_2}`}>
                <ThemeToggle />
            </div>
        </header>
    );
};

export default TopBar;