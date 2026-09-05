import { describe, it, expect } from "vitest";
import { formatDate } from "../lib/formatters.js";

/** The em dash formatDate returns for anything it cannot render (U+2014). */
const EM_DASH = "—";

/**
 * formatDate renders the created/updated line on the project detail page, where
 * the input comes straight from Mongoose timestamps — but also from records that
 * predate a field, hence the emphasis on absent and malformed input.
 */
describe("formatDate", () => {
  it("formats a timestamp as a long US date", () => {
    // Deliberately a full UTC timestamp at midday, NOT a date-only string like
    // "2026-06-14". A date-only string parses as UTC midnight, which is still
    // the previous calendar day anywhere west of Greenwich — so asserting on one
    // would pass here and in CI (both UTC-or-ahead) and fail for a contributor in
    // the Americas. Midday UTC lands on the same date in every timezone.
    expect(formatDate("2026-06-14T12:00:00.000Z")).toBe("June 14, 2026");
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["an empty string", ""],
  ])("returns an em dash for %s", (_label, input) => {
    // The early `if (!isoString)` guard — these are the realistic absent-field
    // cases, since the API omits optional dates rather than sending null.
    expect(formatDate(input)).toBe(EM_DASH);
  });

  it("returns an em dash rather than 'Invalid Date' for unparseable input", () => {
    // Without the Number.isNaN check, toLocaleDateString emits the literal string
    // "Invalid Date" into the UI. This is the test that would catch that guard
    // being removed.
    expect(formatDate("not-a-date")).toBe(EM_DASH);
  });
});
