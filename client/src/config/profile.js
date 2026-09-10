/**
 * Personal profile / contact details.
 * Single source of truth for the owner's contact channels (Contact page), the
 * landing hero copy and static career numbers (Dashboard). Mirrors the
 * base-value + derived-href pattern of `github.js` — update a value here and
 * every consumer follows.
 */

/**
 * Full display name — the landing hero headline, the About greeting, the site
 * footer, and the suffix of every browser-tab title.
 */
export const FULL_NAME = "Tejash Kumar Singh";

/** Primary contact email. */
export const EMAIL = "jaitej123@gmail.com";

/** `mailto:` link, derived from {@link EMAIL}. */
export const EMAIL_HREF = `mailto:${EMAIL}`;

/** Contact phone in display form (with spacing). */
export const PHONE = "+91 9102577699";

/** `tel:` link — digits with the leading `+`, derived from {@link PHONE}. */
export const PHONE_HREF = `tel:${PHONE.replace(/\s+/g, "")}`;

/** LinkedIn handle shown as the link label. */
export const LINKEDIN_HANDLE = "tejash-singh";

/** Full LinkedIn profile URL. */
export const LINKEDIN_URL =
  "https://www.linkedin.com/in/tejash-singh-892a15233/";

/**
 * One-line pitch under the name in the landing hero. A compressed form of the
 * About page's career objective — keep the two telling the same story.
 */
export const TAGLINE =
  "Full-stack developer building responsive React interfaces, Express/MongoDB " +
  "APIs, and serverless integrations on Azure Functions.";

/**
 * @typedef {Object} CareerStat
 * @property {number} count - The headline number shown on the stat tile.
 * @property {string} label - Sub-label naming what the number counts, so the
 *   claim is verifiable at a glance rather than a bare figure.
 */

/**
 * Third-party platforms integrated in production work. Mirrors the Projetly
 * entry in the About page's EXPERIENCE — update both together.
 * @type {CareerStat}
 */
export const INTEGRATIONS = { count: 3, label: "Salesforce · Zapier · Make" };

/**
 * Internships completed. Mirrors the About page's EXPERIENCE list length —
 * update both together.
 * @type {CareerStat}
 */
export const INTERNSHIPS = { count: 2, label: "Projetly · NBPDCL" };
