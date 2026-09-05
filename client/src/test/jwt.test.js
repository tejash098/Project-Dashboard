import { describe, it, expect, afterEach, vi } from "vitest";
import { decodeJwt, isTokenExpired } from "../lib/jwt.js";

/**
 * base64url-encode a string: exactly the transformation decodeJwt undoes.
 *
 * A JWT segment is base64url, not plain base64 — `-` and `_` stand in for `+`
 * and `/`, and the `=` padding is dropped. Written out rather than delegated to
 * Buffer so the test uses the same browser API family as the code under test
 * (which decodes with atob), and so it stays valid in a browser-like test
 * environment where Buffer does not exist.
 *
 * @param {string} text - Raw text to encode.
 * @returns {string} The base64url form.
 */
const b64url = (text) =>
  btoa(text)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/**
 * Build a structurally valid JWT. The signature is deliberately meaningless —
 * nothing here verifies one, so any value works.
 *
 * @param {Object} payload - Claims to encode as the token's middle segment.
 * @returns {string} A `header.payload.signature` token.
 */
const makeToken = (payload) =>
  `${b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${b64url(
    JSON.stringify(payload),
  )}.not-a-real-signature`;

/** A fixed instant to freeze the clock at, so expiry assertions are exact. */
const NOW = new Date("2026-06-14T12:00:00.000Z");
/** The same instant in seconds, which is the unit JWT `exp` claims use. */
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);

describe("decodeJwt", () => {
  it("returns the payload claims of a well-formed token", () => {
    expect(decodeJwt(makeToken({ sub: "ada", role: "admin" }))).toEqual({
      sub: "ada",
      role: "admin",
    });
  });

  it("decodes a token whose signature is meaningless", () => {
    // Documents the security property the JSDoc warns about: this reads the
    // payload without verifying anything, so a forged token decodes just as
    // happily as a real one. Anything gating on the result must be re-checked
    // server side. If someone ever "fixes" this to reject bad signatures, this
    // test failing is the flag to review every caller.
    expect(decodeJwt(`header.${b64url('{"sub":"forged"}')}.total-garbage`)).toEqual({
      sub: "forged",
    });
  });

  it.each([
    ["a string with no dots", "abc"],
    ["a token missing its payload segment", "onlyheader."],
    ["a payload that is not valid base64", "x.@@@.z"],
    ["a payload that is not JSON", `x.${b64url("hello")}.z`],
    ["an empty string", ""],
    ["null", null],
    ["undefined", undefined],
  ])("returns null for %s", (_label, input) => {
    // Every one of these would throw somewhere inside — split, atob, or
    // JSON.parse. The contract is that callers get null instead of an
    // exception, so a corrupt localStorage value can't crash the app on boot.
    expect(decodeJwt(input)).toBeNull();
  });
});

describe("isTokenExpired", () => {
  // Freezing the clock is what makes the boundary case below assertable at all.
  // With a real clock you can only test "comfortably past" and "comfortably
  // future" and hope the margins outrun execution time.
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Pin the clock to NOW so `exp` comparisons are deterministic. */
  const freezeClock = () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  };

  it("treats a token expiring in the future as valid", () => {
    freezeClock();
    expect(isTokenExpired(makeToken({ exp: NOW_SECONDS + 3600 }))).toBe(false);
  });

  it("treats a token that expired in the past as expired", () => {
    freezeClock();
    expect(isTokenExpired(makeToken({ exp: NOW_SECONDS - 1 }))).toBe(true);
  });

  it("treats a token expiring at this exact second as expired", () => {
    // The comparison is `exp * 1000 <= Date.now()`, so the boundary is
    // inclusive. Worth pinning: flipping it to `<` would silently let a
    // just-expired token through, and no other test would notice.
    freezeClock();
    expect(isTokenExpired(makeToken({ exp: NOW_SECONDS }))).toBe(true);
  });

  it("treats a token with no exp claim as non-expiring", () => {
    // Documented behaviour, and a deliberate one: absence of an expiry is not
    // the same as an expiry in the past.
    freezeClock();
    expect(isTokenExpired(makeToken({ sub: "ada" }))).toBe(false);
  });

  it.each([
    ["a malformed token", "abc"],
    ["an empty string", ""],
    ["null", null],
    ["undefined", undefined],
  ])("treats %s as expired", (_label, input) => {
    // Fails closed: anything unreadable is treated as expired rather than
    // trusted, so a corrupt token logs the user out instead of granting a
    // half-authenticated session.
    expect(isTokenExpired(input)).toBe(true);
  });
});
