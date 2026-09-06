import { useState, useCallback, useRef, useEffect } from "react";
import Toast from "../components/ui/Toast";
import { ToastContext } from "./ToastContext";
import { useSlowServerToast } from "../hooks/useSlowServerToast";

/** How long (ms) a toast stays on screen before auto-dismissing. */
const TOAST_TTL = 3500;

/**
 * Provides a lightweight toast notification system to the component tree.
 * Renders the toast stack itself so any component can call `addToast` without
 * worrying about where the toasts appear.
 *
 * @param {React.ReactNode} children - Child components.
 */
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  // Monotonic id source so React keys stay stable as toasts come and go.
  const nextId = useRef(0);
  // Auto-dismiss handles by toast id. A ref rather than state because nothing
  // renders from them — but they must be cancellable: a re-keyed toast would
  // otherwise inherit its predecessor's timer and vanish early, and a timer
  // outliving unmount would set state on a dead tree.
  const timers = useRef(new Map());

  /** Cancel and forget one toast's auto-dismiss timer, if it has one. */
  const clearTimer = useCallback((id) => {
    const handle = timers.current.get(id);
    if (handle === undefined) return;
    clearTimeout(handle);
    timers.current.delete(id);
  }, []);

  /** Remove a toast by id (called on auto-dismiss or manual close). */
  const removeToast = useCallback(
    (id) => {
      clearTimer(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    },
    [clearTimer],
  );

  /**
   * Queue a toast, or update one already on screen, and schedule its dismissal.
   *
   * @param {Object} toast - Toast to show.
   * @param {string} [toast.key] - Stable id. Re-adding with the same key
   *   replaces that toast in place instead of stacking a second one; omit it for
   *   a one-off toast and an auto id is assigned.
   * @param {"success"|"error"|"info"|"loading"} [toast.type] - Icon and colour.
   * @param {string} toast.message - Primary line.
   * @param {string} [toast.detail] - Optional smaller second line.
   * @param {number} [toast.since] - Epoch ms; renders a live elapsed counter.
   * @param {number|null} [toast.duration] - Ms before auto-dismiss, or null to
   *   pin the toast open until something dismisses it.
   * @returns {string} The toast's id, for a later `dismissToast`.
   */
  const addToast = useCallback(
    ({
      key,
      type = "success",
      message,
      detail,
      since,
      duration = TOAST_TTL,
    }) => {
      console.log(`[Toast] ${type}: ${message}`);
      // A caller-supplied key doubles as the id, which is what makes a toast
      // updatable at all: without one, every call would append.
      const id = key ?? `toast-${nextId.current++}`;

      setToasts((prev) => {
        const next = { id, type, message, detail, since };
        const index = prev.findIndex((t) => t.id === id);
        if (index === -1) return [...prev, next];
        // Replace in place so an escalating toast holds its slot in the stack
        // rather than jumping to the bottom as if it were new.
        const updated = [...prev];
        updated[index] = next;
        return updated;
      });

      // Re-arm from scratch — an update restarts the countdown, and a null
      // duration leaves the toast pinned with no timer at all.
      clearTimer(id);
      if (duration !== null) {
        timers.current.set(id, setTimeout(() => removeToast(id), duration));
      }
      return id;
    },
    [clearTimer, removeToast],
  );

  // Drop every outstanding timer on unmount so none of them fire against an
  // unmounted tree.
  useEffect(() => {
    const handles = timers.current;
    return () => {
      handles.forEach(clearTimeout);
      handles.clear();
    };
  }, []);

  // Listen for rate-limit events broadcast by the Axios response interceptor
  // (which runs outside React). Same bridge pattern as auth:unauthorized.
  useEffect(() => {
    const onRateLimited = (e) => {
      addToast({
        type: "error",
        message: e.detail?.message || "Too many requests. Please slow down.",
      });
    };
    window.addEventListener("api:rate-limited", onRateLimited);
    return () => window.removeEventListener("api:rate-limited", onRateLimited);
  }, [addToast]);

  // Cold-start advisory — bridges the slow-request events from the same
  // interceptors. Takes the dispatchers as arguments because a hook running
  // inside this provider cannot consume the context the provider supplies.
  useSlowServerToast(addToast, removeToast);

  return (
    <ToastContext.Provider value={{ addToast, dismissToast: removeToast }}>
      {children}
      {/* Toast stack lives at the provider root so it overlays the whole app. */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
