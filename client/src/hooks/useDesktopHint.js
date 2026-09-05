import { useEffect, useRef } from "react";
import { useToast } from "./useToast";

/**
 * Viewport the hint applies below, paired with a coarse pointer.
 *
 * The width matches the app's existing mobile line (SidebarProvider's
 * `innerWidth >= 768` and the `md:` variants throughout AppShell), expressed as
 * a max so the two don't overlap. The pointer clause is what keeps the advice
 * honest: it limits the toast to real touch devices. A desktop user with a
 * narrow window has no "Desktop site" menu item to reach for — they would just
 * widen the window — so telling them to switch modes would be nonsense.
 */
const MOBILE_QUERY = "(max-width: 767px) and (pointer: coarse)";

/** Advice shown to mobile visitors; kept short for the toast's max-w-xs panel. */
const HINT_MESSAGE =
  'Best viewed on a wider screen — try "Desktop site" in your browser menu.';

/**
 * Show mobile visitors a one-off toast pointing at their browser's desktop-mode
 * toggle. The dashboard's sidebar, stat grids, charts and project cards are laid
 * out for wide screens and collapse to a single column on a phone; desktop mode
 * restores the intended layout, but nothing otherwise advertises that it exists.
 *
 * Call from a component that survives client-side navigation (AppShell), so this
 * fires once per full page load rather than on every route change.
 *
 * @returns {void}
 */
export const useDesktopHint = () => {
  const { addToast } = useToast();
  // StrictMode double-invokes effects in development; without this the hint
  // would stack two identical toasts on every load and look like a bug.
  const hinted = useRef(false);

  useEffect(() => {
    if (hinted.current) return;
    if (!window.matchMedia(MOBILE_QUERY).matches) return;

    hinted.current = true;
    console.log("[useDesktopHint] mobile viewport — suggesting desktop mode");
    addToast({ type: "info", message: HINT_MESSAGE });
  }, [addToast]);
};
