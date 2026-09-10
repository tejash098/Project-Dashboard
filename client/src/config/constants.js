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
  // Fills the scroll container so AppShell's footer can be pushed to the bottom
  // of the viewport on pages too short to scroll.
  MIN_FULL: "min-h-full",
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
    // Four landing-page stat tiles — 2×2 on phones and tablets, one row from
    // `lg` so the numbers read as a single strip under the hero.
    STATS: "grid grid-cols-2 lg:grid-cols-4",
    // One project per row — each card pairs a wide preview with its details, so
    // the old 3-up layout no longer leaves enough width for both columns.
    PROJECTS: "grid grid-cols-1",
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

// New group — floating chat assistant (ChatWidget)
export const CHAT = {
    // Hard server limit — POST /api/chat rejects anything longer with a 400.
    // Mirrors `chatMaxMessageChars` in server/src/config/env.js.
    MAX_MESSAGE_CHARS: 500,
    // Show the character counter only once the cap is close enough to matter;
    // a counter sitting at 3/500 is noise.
    COUNTER_THRESHOLD: 50,
    // Six turns each way — mirrors the server's `chatMaxHistoryTurns`, so the
    // request carries what the server would have kept anyway rather than
    // paying to send turns it is about to drop.
    MAX_HISTORY_MESSAGES: 12,
    // Circular launcher pinned bottom-right. 56px clears the 44px touch-target
    // floor. The z-index is composed at the call site, like DRAWER.BASE.
    FAB: "fixed bottom-4 right-4 h-14 w-14",
    // Opens upward from the launcher, leaving a gap above it. The width cap
    // keeps it on screen at 320px; the height cap keeps it off the top edge of
    // a short viewport.
    PANEL: "fixed bottom-24 right-4 flex flex-col w-96 max-w-[calc(100vw-2rem)] h-[28rem] max-h-[calc(100vh-7rem)]",
    // The only scrolling region — the header, pills and composer stay pinned so
    // the input never walks off the bottom of a long conversation.
    TRANSCRIPT: "flex-1 overflow-y-auto",
    // Shared bubble geometry. pre-wrap because Shift+Enter newlines and the
    // model's own line breaks both have to survive.
    BUBBLE: "max-w-[85%] px-3 py-2 whitespace-pre-wrap break-words",
};

// New group — live project preview frame (LivePreview)
export const PREVIEW = {
    // Pulls the whole panel in from the page's max-w-7xl content width. Sits on
    // the section, not the frame, so the host/Open strip and the caption stay
    // flush with the frame's edges instead of overhanging it. The cap alone only
    // bites past ~1425px of viewport, so the percentage keeps the inset visible
    // on mid-size screens too — and only from `lg` up, so narrow layouts stay
    // flush with the rest of the page content.
    MAX_W: "max-w-6xl lg:w-[95%]",
    // Slightly flatter than 16/9, which trims the bottom without letterboxing.
    FRAME: "aspect-[16/8.5] w-full overflow-hidden",
    // Card thumbnail tile — holds the stored screenshot beside the details
    // column, and is never a click target: the card's stretched link must
    // receive the click.
    CARD_FRAME: "aspect-video w-full overflow-hidden pointer-events-none",
    // The screenshot itself — cropped to fill the tile, anchored to the top of
    // the page rather than centred.
    THUMB_IMG: "w-full h-full object-cover object-top",
    IFRAME: "w-full h-full border-0",
};

// New group — landing hero (Dashboard)
export const HERO = {
    // The one page-level headline in the app, so it deliberately outsizes every
    // TYPOGRAPHY token. Responsive variants can't be composed from those
    // single-size tokens, hence a dedicated group; `sm:` keeps the name on one
    // line on phones without shrinking it on desktop.
    TITLE: "text-3xl sm:text-4xl font-bold tracking-tight",
    // One-line pitch under the name — capped width so it wraps at a readable
    // measure instead of stretching across the 7xl container.
    TAGLINE: "text-base sm:text-lg leading-relaxed max-w-2xl",
};
