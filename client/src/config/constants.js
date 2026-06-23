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

// ── Borders ──────────────────────────────────────────────────
export const BORDER = {
  DEFAULT: "border-border",
  BOTTOM: "border-b border-border",
  TOP: "border-t border-border",
  RIGHT: "border-r border-border",
  LEFT_2: "border-l-2",
  ACCENT: "border-accent",
  TRANSPARENT: "border-transparent",
};

// ── Sidebar ─────────────────────────────────────────────────
export const SIDEBAR = {
  EXPANDED_WIDTH: "w-56",
  COLLAPSED_WIDTH: "w-16",
  TRANSITION: "transition-all duration-300 ease-in-out",
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
  FULL: "rounded-full",
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
  P_6: "p-6",
  MX_2: "mx-2",
  ML_AUTO: "ml-auto",
  MT_1: "mt-1",
  MT_2: "mt-2",
  MB_6: "mb-6",
  GAP_4: "gap-4",
  MR_4: "mr-4",
};

// ── Layout heights ───────────────────────────────────────────
export const HEIGHT = {
  SCREEN: "h-screen",
  TOPBAR: "h-16", // mobile-only top bar height (AppShell)
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
  TEXT_2XL: "text-2xl",
  FONT_MEDIUM: "font-medium",
  FONT_SEMIBOLD: "font-semibold",
  FONT_BOLD: "font-bold",
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
  ITEMS_START: "items-start",
  JUSTIFY_BETWEEN: "justify-between",
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

// New group for grid
export const GRID = {
    STATS: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    PROJECTS: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
};

// New group for max width
export const CONTAINER = {
    MAX_W: "max-w-7xl mx-auto",
};


// New group — z-index layers
export const Z_INDEX = {
    DRAWER: "z-40",
    BACKDROP: "z-30",
    MODAL: "z-50", // overlays the drawer; used by the portal Modal + toasts
    LIGHTBOX: "z-[60]", // sits above the modal/toasts; used by the image lightbox
};

// New group — responsive drawer behavior
export const DRAWER = {
    MOBILE_WIDTH: "w-64",
    BASE: "fixed top-0 left-0 h-full md:static md:translate-x-0 md:z-auto",
    OPEN: "translate-x-0",
    CLOSED: "-translate-x-full",
    TRANSITION: "transition-transform md:transition-all duration-300 ease-in-out",
};

// New group — focus accessibility (reuse everywhere)
export const A11Y = {
    FOCUS_RING: "focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none",
    MOTION_SAFE: "motion-reduce:transition-none",
};