import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PageLayout from "../layouts/PageLayout.jsx";
import { FULL_NAME } from "../config/profile.js";

/**
 * Every route renders through PageLayout, so this is where the browser-tab
 * title is decided. Three things are easy to break silently: a page with a
 * JSX title stringifying to "[object Object]", the landing page inheriting a
 * stale title from the previous route, and the header block rendering an
 * empty margined div above the hero.
 */
describe("PageLayout", () => {
  it("suffixes a string title with the owner's name", () => {
    render(<PageLayout title="Projects">body</PageLayout>);
    expect(document.title).toBe(`Projects — ${FULL_NAME}`);
  });

  it("falls back to the bare owner name when there is no title", () => {
    render(<PageLayout>body</PageLayout>);
    expect(document.title).toBe(FULL_NAME);
  });

  it("uses documentTitle when the visible title is JSX", () => {
    render(
      <PageLayout title={<em>Editable</em>} documentTitle="My Project">
        body
      </PageLayout>,
    );
    expect(document.title).toBe(`My Project — ${FULL_NAME}`);
  });

  it("never stringifies a JSX title into the tab", () => {
    render(<PageLayout title={<em>Editable</em>}>body</PageLayout>);
    expect(document.title).toBe(FULL_NAME);
    expect(document.title).not.toMatch(/object/i);
  });

  it("omits the header block entirely when it has nothing to show", () => {
    render(<PageLayout>body</PageLayout>);
    // No heading, and the body is the wrapper's only child — no empty
    // `mb-6` header div sitting above the landing hero.
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.getByText("body").parentElement.children).toHaveLength(1);
  });
});
