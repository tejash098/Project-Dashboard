import { useContext } from "react";
import { ToastContext } from "../context/ToastContext";

/**
 * Returns the toast dispatchers from ToastContext.
 *
 * `addToast` takes `{ key?, type?, message, detail?, since?, duration? }` and
 * returns the toast's id. Passing a `key` makes the toast updatable — re-adding
 * with the same key replaces it in place — and `duration: null` pins it open
 * until `dismissToast` clears it. Both are only needed for a toast that changes
 * while on screen (see useSlowServerToast); a one-off `{ type, message }` call
 * still behaves exactly as before.
 *
 * @returns {{
 *   addToast: (toast: {
 *     key?: string,
 *     type?: "success"|"error"|"info"|"loading",
 *     message: string,
 *     detail?: string,
 *     since?: number,
 *     duration?: number|null,
 *   }) => string,
 *   dismissToast: (id: string) => void,
 * }} The toast API.
 */
export const useToast = () => {
  return useContext(ToastContext);
};
