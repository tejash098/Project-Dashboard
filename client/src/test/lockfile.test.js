import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const LOCKFILE = resolve(here, "../../package-lock.json");

/** The binding CI needs, since the workflow runs on ubuntu-latest. */
const CI_BINDING = "node_modules/@rolldown/binding-linux-x64-gnu";

/**
 * A repo-hygiene test rather than an application test, and it earns its place:
 * this exact problem has broken CI twice.
 *
 * Vite builds on Rolldown, which ships its native binary as fifteen
 * platform-specific optional dependencies. npm has a long-standing bug
 * (npm/cli#4828) where regenerating a lockfile in place — after a merge
 * conflict, or after another package manager has churned the tree — prunes it
 * down to whichever platform the machine happens to be. Everything then passes
 * on Windows and `npm ci` on Ubuntu installs nothing usable, failing with
 * "Cannot find native binding" long after the commit that caused it.
 *
 * Nothing else notices, because the lockfile is not code and no test reads it.
 * Living here means the pre-push hook catches it before it ever reaches CI.
 *
 * If this fails: do not hand-edit the lockfile. Delete `node_modules` and
 * `package-lock.json` and run `npm install`, which records every platform with
 * its os/cpu constraints.
 */
describe("package-lock.json", () => {
  const lockfile = JSON.parse(readFileSync(LOCKFILE, "utf8"));
  const bindings = Object.keys(lockfile.packages).filter((name) =>
    name.startsWith("node_modules/@rolldown/binding-"),
  );

  it("records the native binding CI installs on", () => {
    expect(bindings).toContain(CI_BINDING);
  });

  it("records more than one platform, proving it was not pruned to this machine", () => {
    // The failure mode is a lockfile holding exactly one binding — whichever
    // matches whoever last regenerated it. One entry is the smoking gun.
    expect(bindings.length).toBeGreaterThan(1);
  });

  it("marks the bindings optional and platform-scoped", () => {
    // npm only installs the entry matching the current os/cpu. Without these
    // constraints it would try to install all fifteen everywhere.
    const entry = lockfile.packages[CI_BINDING];

    expect(entry.optional).toBe(true);
    expect(entry.os).toContain("linux");
    expect(entry.cpu).toContain("x64");
  });
});
