/**
 * Application-wide constants.
 * Single source of truth for shared values used across components.
 * Update here — changes reflect everywhere automatically.
 */

// ── Icon sizes ──────────────────────────────────────────────
export const ICON_SIZE = {
    SM: 16,
    MD: 20,
    LG: 24,
    XL: 32,
};

// ── Sidebar ─────────────────────────────────────────────────
export const SIDEBAR = {
    EXPANDED_WIDTH:  "w-56",
    COLLAPSED_WIDTH: "w-16",
    TRANSITION:      "transition-all duration-300 ease-in-out",
};

// ── Transition ───────────────────────────────────────────────
export const TRANSITION = {
    COLORS: "transition-colors duration-200",
    COLORS_SLOW: "transition-colors duration-300",
};

// ── Border radius ────────────────────────────────────────────
export const ROUNDED = {
    SM: "rounded",
    MD: "rounded-lg",
    LG: "rounded-xl",
};

// ── Spacing ──────────────────────────────────────────────────
export const SPACING = {
    GAP_2: "gap-2",
    GAP_3: "gap-3",
    PX_3: "px-3",
    PX_5: "px-5",
    PX_6: "px-6",
    PY_2_5: "py-2.5",
    PY_3: "py-3",
    PY_4: "py-4",
    PY_6: "p-6",
    MX_2: "mx-2",
    ML_AUTO: "ml-auto",
};

// ── Layout heights ───────────────────────────────────────────
export const HEIGHT = {
    SCREEN: "h-screen",
    TOPBAR: "h-16",
    SIDEBAR_TOGGLE: "h-16",
    ICON_BUTTON: "h-8",
    FULL: "h-full",
};

// ── Layout widths ────────────────────────────────────────────
export const WIDTH = {
    ICON_BUTTON: "w-8",
    FULL: "w-full",
};

// ── Typography ───────────────────────────────────────────────
export const TYPOGRAPHY = {
    TEXT_XS: "text-xs",
    TEXT_SM: "text-sm",
    FONT_MEDIUM: "font-medium",
    FONT_SEMIBOLD: "font-semibold",
};

// ── Flex utilities ───────────────────────────────────────────
export const FLEX = {
    SHRINK_0: "shrink-0",
    FLEX_1: "flex-1",
    MIN_W_0: "min-w-0",
    ML_AUTO: "ml-auto",
    COL: "flex-col",
    ROW: "flex",
    CENTER: "flex items-center",
    CENTER_JUSTIFY: "flex items-center justify-center",
};

// ── Overflow and sizing ──────────────────────────────────────
export const SIZING = {
    OVERFLOW_HIDDEN: "overflow-hidden",
    OVERFLOW_Y_AUTO: "overflow-y-auto",
    WHITESPACE_NOWRAP: "whitespace-nowrap",
    CURSOR_POINTER: "cursor-pointer",
    FLEX_SHRINK_0: "flex-shrink-0",
    OVERFLOW: "overflow-hidden",
};

// ── AppShell specific ────────────────────────────────────────
export const APPSHELL = {
    MAIN_PADDING: "p-6",
    FLEX_SHRINK: "flex-shrink-0",
};