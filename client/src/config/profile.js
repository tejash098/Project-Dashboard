/**
 * Personal profile / contact details.
 * Single source of truth for the owner's contact channels, surfaced on the
 * Contact page. Mirrors the base-value + derived-href pattern of `github.js` —
 * update a value here and every consumer follows.
 */

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
