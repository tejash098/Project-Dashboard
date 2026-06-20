/**
 * Minimal, dependency-free JWT helpers for the client.
 *
 * These only *read* the token payload for cheap client-side checks (e.g. "is
 * this stored token already expired?"). They do NOT verify the signature —
 * that's the server's job. Never trust these for authorization decisions; they
 * exist purely to avoid showing a logged-in UI with a token the server will
 * reject anyway.
 */

/**
 * Decode the payload (middle segment) of a JWT without verifying its signature.
 * Handles base64url → base64 conversion and UTF-8 safe decoding.
 *
 * @param {string} token - A JWT of the form `header.payload.signature`.
 * @returns {Object|null} The decoded payload object, or null if it can't be parsed.
 */
export const decodeJwt = (token) => {
  try {
    // A JWT has three dot-separated parts; the payload is the middle one.
    const payload = token.split(".")[1];
    if (!payload) return null;

    // base64url → base64, then decode and JSON-parse the bytes.
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    // Malformed token — treat as undecodable rather than throwing.
    return null;
  }
};

/**
 * Check whether a JWT is expired (or unreadable) based on its `exp` claim.
 * A token with no `exp` is treated as non-expiring (returns false).
 *
 * @param {string} token - The JWT to inspect.
 * @returns {boolean} True when the token is missing, malformed, or past `exp`.
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  const payload = decodeJwt(token);
  if (!payload) return true;
  // `exp` is in seconds since epoch; Date.now() is milliseconds.
  if (!payload.exp) return false;
  return payload.exp * 1000 <= Date.now();
};
