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
  // The generous timeout is deliberate: this test's cost is not the thing it
  // asserts. Its body is a single dynamic import that transforms an eight-module
  // chain (controller → Project → cloudinary → env → slugify → captureScreenshot),
  // which is the slowest operation in the suite — ~650ms warm, and more on a cold
  // Vite cache. Vitest's 5s default leaves too little headroom when a sibling
  // worker is spawning mongodb-memory-server's mongod binary at the same moment;
  // that contention alone times this out and blocks the pre-push hook with
  // nothing actually broken. Raising the budget weakens nothing, because the
  // assertions below — not the clock — are what catch a regression: if the env
  // guard ever starts exiting the process, this still fails loudly.
  it(
    "can import a controller without the env guard exiting the process",
    async () => {
      const controller = await import("../controllers/projectController.js");

      expect(typeof controller.getAllProjects).toBe("function");
      expect(typeof controller.refreshProjectPreview).toBe("function");
    },
    20_000,
  );
});
