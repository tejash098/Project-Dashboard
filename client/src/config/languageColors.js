/**
 * Programming-language → accent color map for the small dot shown on repo cards.
 * Hex values mirror GitHub's own language colors for familiarity. Lookups for
 * unlisted languages (or a `null` language) fall back to a neutral token so the
 * UI never breaks — see `getLanguageColor`.
 */
const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Shell: "#89e051",
  Vue: "#41b883",
  Dart: "#00B4AB",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  SCSS: "#c6538c",
};

/** Fallback color (a CSS var) used when a language has no mapped color. */
const FALLBACK_COLOR = "var(--color-text-secondary)";

/**
 * Resolve a display color for a repo's primary language.
 * @param {string|null} language - GitHub `language` field (may be null).
 * @returns {string} A hex color, or a neutral CSS variable fallback.
 */
export const getLanguageColor = (language) =>
  LANGUAGE_COLORS[language] ?? FALLBACK_COLOR;

export default LANGUAGE_COLORS;
