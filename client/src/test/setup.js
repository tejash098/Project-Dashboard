import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Testing Library only auto-cleans when Vitest runs with `globals: true`, which
// this project deliberately does not — every helper is imported explicitly. So
// unmounting has to be wired up by hand, or each test would render into a DOM
// still holding the previous test's markup and queries like getByRole would
// start failing with "found multiple elements".
afterEach(cleanup);
