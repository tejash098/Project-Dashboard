import { describe, it, expect } from "vitest";
import { slugify } from "../utils/slugify.js";

describe("slugify", () => {
  it("lowercases and hyphenates a normal title", () => {
    expect(slugify("My Cool App!! v2")).toBe("my-cool-app-v2");
  });
});
