import { describe, it, expect } from "vitest";

/**
 * A canary for the vitest.config.js env block.
 *
 * config/env.js calls process.exit(1) on a missing required variable, so if
 * that block is ever removed or renamed, importing any module that reaches it
 * takes the whole runner down — silently, with no failing test to point at the
 * cause. This test imports the heaviest of those chains on purpose, so the
 * breakage shows up here, next to an explanation, rather than as an unexplained
 * exit code in someone's terminal.
 */
describe("server test environment", () => {
  it("can import a controller without the env guard exiting the process", async () => {
    const controller = await import("../controllers/projectController.js");

    expect(typeof controller.getAllProjects).toBe("function");
    expect(typeof controller.refreshProjectPreview).toBe("function");
  });
});
