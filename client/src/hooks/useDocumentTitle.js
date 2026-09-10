import { useEffect } from "react";
import { FULL_NAME } from "../config/profile";

/**
 * Set the browser-tab title for the current page as "<title> — <owner name>",
 * or just the owner's name when no page title is given (the landing hero).
 * Distinct titles per route make open tabs and browser history legible.
 *
 * No reset on unmount on purpose: every route renders a PageLayout, so the
 * next page overwrites the title anyway and a reset would only flicker.
 * @param {string} [title] - Page title, or undefined for the bare site name.
 * @returns {void}
 */
export const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} — ${FULL_NAME}` : FULL_NAME;
  }, [title]);
};
