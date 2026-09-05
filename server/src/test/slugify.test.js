import { describe, it, expect } from "vitest";
import { slugify } from "../utils/slugify.js";

/**
 * slugify derives the URL identifier every project is addressed by, and
 * generateUniqueSlug in projectController builds on its output. A change here
 * changes project URLs, so the edge cases are pinned deliberately.
 */
describe("slugify", () => {
  it("lowercases and hyphenates a normal title", () => {
    expect(slugify("My Cool App!! v2")).toBe("my-cool-app-v2");
  });

  it("trims surrounding junk instead of leaving stray hyphens", () => {
    // Punctuation at either end becomes a hyphen in the first replace, then the
    // second replace strips it. Without that second pass the slug would be
    // "-hello-" and every URL would carry the noise.
    expect(slugify("  !Hello!  ")).toBe("hello");
  });

  it("collapses a run of separators into a single hyphen", () => {
    // The `+` in /[^a-z0-9]+/g is what does this. Drop it and you get "a---b".
    expect(slugify("a  -  b")).toBe("a-b");
  });

  it("treats a dot as a separator rather than keeping it", () => {
    expect(slugify("Node.js v22")).toBe("node-js-v22");
  });

  it("returns an empty string when nothing survives", () => {
    // Documented in the JSDoc as possible, and it matters: an empty slug would
    // make the project unreachable, since the route is /projects/:slug. Worth
    // knowing the controller does NOT currently guard against this — a project
    // titled "!!!" would be created with an empty slug.
    expect(slugify("!!!")).toBe("");
  });

  it.each([
    ["an empty string", ""],
    ["only whitespace", "   "],
    ["undefined", undefined],
    ["null", null],
  ])("returns an empty string for %s", (_label, input) => {
    // `String(title || "")` is what makes the nullish cases safe rather than
    // throwing on .toLowerCase().
    expect(slugify(input)).toBe("");
  });

  it("drops accented characters rather than transliterating them", () => {
    // Pins a real shortcoming rather than endorsing it. The character class is
    // /[^a-z0-9]+/, so "é" is a separator, not a letter — "café" loses its
    // final character entirely instead of becoming "cafe". Any non-Latin title
    // degrades the same way, and a title of only non-Latin characters slugs to
    // "" (see the empty-string case above).
    //
    // If this is ever fixed with a Unicode normalisation pass, this test
    // failing is the signal to review it, not a regression.
    expect(slugify("café")).toBe("caf");
  });

  it("coerces a non-string title", () => {
    // generateUniqueSlug passes req.body.title straight through, and the body
    // is unvalidated JSON — a numeric title is reachable from the API.
    expect(slugify(123)).toBe("123");
  });

  it("returns an empty string for the number zero", () => {
    // A consequence of `title || ""`: 0 is falsy, so it becomes "" rather than
    // "0". Inconsistent with 123 above, and worth having written down.
    expect(slugify(0)).toBe("");
  });
});
