import { useContext } from "react";
import { ToastContext } from "../context/ToastContext";

/**
 * Returns the toast dispatcher from ToastContext.
 *
 * @returns {{ addToast: (toast: { type?: "success"|"error", message: string }) => void }}
 *   The toast API.
 */
export const useToast = () => {
  return useContext(ToastContext);
};
