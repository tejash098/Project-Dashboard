import { describe, it, expect } from "vitest";
import { getStatusCounts } from "../lib/projectStats.js";

/**
 * getStatusCounts feeds the Dashboard stat cards and the Projects filter tabs,
 * so its shape is load-bearing: the tabs read `total`, `active` and `completed`
 * by name and would render "undefined" if any of them went missing.
 */
describe("getStatusCounts", () => {
  it("returns a fully zeroed tally for an empty list", () => {
    // The seed object matters: the tabs render counts before any data loads,
    // so the three keys must exist even with nothing to count.
    expect(getStatusCounts([])).toEqual({ total: 0, active: 0, completed: 0 });
  });

  it("counts each status and keeps total as the sum of all projects", () => {
    const counts = getStatusCounts([
      { status: "active" },
      { status: "active" },
      { status: "completed" },
    ]);
    expect(counts).toEqual({ total: 3, active: 2, completed: 1 });
  });

  it("leaves a status at zero when nothing has it", () => {
    // Guards the `|| 0` seed: a missing key must read as 0, never undefined.
    expect(getStatusCounts([{ status: "active" }])).toEqual({
      total: 1,
      active: 1,
      completed: 0,
    });
  });

  it("adds a key for a status outside the schema enum", () => {
    // Documents current behaviour rather than endorsing it. The reducer writes
    // `counts[project.status]` blindly, so an unexpected status silently widens
    // the returned object beyond the three keys the JSDoc promises. Harmless for
    // today's callers, which read known keys by name — but if this test ever
    // fails because the shape was tightened, that is an improvement, not a
    // regression. The Project schema only permits "active" | "completed", so
    // reaching this state needs data written outside Mongoose validation.
    expect(getStatusCounts([{ status: "active" }, { status: "archived" }])).toEqual({
      total: 2,
      active: 1,
      completed: 0,
      archived: 1,
    });
  });
});
