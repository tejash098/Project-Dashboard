import { describe, it, expect } from "vitest";
import {
  buildDonutData,
  EXCLUDED_LANGUAGES,
  LANGUAGE_METHOD_LABEL,
  OTHER_LABEL,
} from "../lib/languageStats.js";

/**
 * The Languages donut is a claim about what the owner writes, and GitHub's
 * byte counts let notebook JSON dwarf real code (two notebook repos were ~75%
 * of all bytes). These tests pin the exclusion — and pin that the percentages
 * are recomputed over what remains, not merely relabelled.
 */
describe("buildDonutData", () => {
  it("drops excluded languages and re-bases percentages on the rest", () => {
    const slices = buildDonutData({
      JavaScript: 600,
      "Jupyter Notebook": 4000,
      CSS: 400,
    });

    // Percentages must be shares of the 1000 non-notebook bytes, not of 5000.
    expect(slices).toEqual([
      { name: "JavaScript", value: 600, percent: 60 },
      { name: "CSS", value: 400, percent: 40 },
    ]);
  });

  it("returns no slices when only excluded languages remain", () => {
    // The page renders its empty-state copy on [] — an all-notebook account
    // must not produce a single 100% slice for a language the chart hides.
    expect(buildDonutData({ "Jupyter Notebook": 4000 })).toEqual([]);
  });

  it("folds the tail into Other without counting excluded bytes", () => {
    const slices = buildDonutData({
      JavaScript: 700,
      CSS: 100,
      HTML: 80,
      Python: 60,
      Apex: 30,
      Shell: 20,
      Nix: 10,
      "Jupyter Notebook": 9000,
    });

    // Default cap is 6 slices: five named + Other (Shell + Nix).
    expect(slices).toHaveLength(6);
    expect(slices.map((s) => s.name)).not.toContain("Jupyter Notebook");
    expect(slices.at(-1)).toEqual({ name: OTHER_LABEL, value: 30, percent: 3 });

    // Rounded percents may drift by a tenth, but never by the notebook share.
    const sum = slices.reduce((acc, s) => acc + s.percent, 0);
    expect(sum).toBeGreaterThan(99.5);
    expect(sum).toBeLessThan(100.5);
  });

  it("keeps the caption honest about the exclusion", () => {
    // The caption is the only place a reader learns notebooks were dropped;
    // if the list ever changes, the label has to change with it.
    expect(EXCLUDED_LANGUAGES).toContain("Jupyter Notebook");
    expect(LANGUAGE_METHOD_LABEL).toMatch(/notebooks excluded/i);
  });
});
