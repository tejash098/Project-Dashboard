/**
 * Convert an arbitrary title into a URL-safe slug: lowercased, with runs of
 * non-alphanumeric characters collapsed to single hyphens and no leading or
 * trailing hyphens. e.g. "My Cool App!! v2" → "my-cool-app-v2".
 * @param {string} title - The source text (typically a project title).
 * @returns {string} The slugified string (may be empty if `title` has no alphanumerics).
 */
export const slugify = (title) =>
  String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics → hyphen
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
