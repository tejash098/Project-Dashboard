import { createContext, useState, useCallback, useRef } from "react";
import Toast from "../components/ui/Toast";

/**
 * Context object for the toast notification queue.
 * Consumed via the useToast hook.
 */
export const ToastContext = createContext();

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

  /** Remove a toast by id (called on auto-dismiss or manual close). */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Queue a toast and schedule its auto-dismissal.
   * @param {{ type?: "success"|"error", message: string }} toast - Toast to show.
   */
  const addToast = useCallback(
    ({ type = "success", message }) => {
      console.log(`[Toast] ${type}: ${message}`);
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => removeToast(id), TOAST_TTL);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast stack lives at the provider root so it overlays the whole app. */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
