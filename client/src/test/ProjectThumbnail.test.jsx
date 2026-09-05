import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProjectThumbnail from "../components/ui/ProjectThumbnail.jsx";

/** Text the component shows whenever there is no usable screenshot. */
const PLACEHOLDER = "No preview yet";

/**
 * ProjectThumbnail is the left half of every card on the projects list. It has
 * exactly three visual states, and the third — a stored URL whose Cloudinary
 * asset has since been deleted — is the one a person would never think to click
 * through by hand.
 */
describe("ProjectThumbnail", () => {
  it("renders the stored screenshot when one exists", () => {
    render(
      <ProjectThumbnail imageUrl="https://res.cloudinary.com/x/shot.png" title="Portfolio" />,
    );

    // Queried by role rather than test id: if the image ever loses its alt text
    // it stops being exposed as an image to assistive tech, and this query is
    // what would notice.
    const img = screen.getByRole("img", { name: "Screenshot of Portfolio" });
    expect(img).toHaveAttribute("src", "https://res.cloudinary.com/x/shot.png");
    expect(screen.queryByText(PLACEHOLDER)).not.toBeInTheDocument();
  });

  it("renders the placeholder when there is no screenshot", () => {
    render(<ProjectThumbnail title="Portfolio" />);

    expect(screen.getByText(PLACEHOLDER)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("treats an empty imageUrl as no screenshot", () => {
    // `Boolean(imageUrl)` rather than a bare truthiness check on a possibly
    // absent field — an empty string from the API must not render a broken img.
    render(<ProjectThumbnail imageUrl="" title="Portfolio" />);

    expect(screen.getByText(PLACEHOLDER)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("falls back to the placeholder when the image fails to load", () => {
    render(
      <ProjectThumbnail imageUrl="https://res.cloudinary.com/x/deleted.png" title="Portfolio" />,
    );

    const img = screen.getByRole("img");
    expect(screen.queryByText(PLACEHOLDER)).not.toBeInTheDocument();

    // jsdom never fetches images, so `error` will not fire on its own — the
    // event has to be dispatched. That is not a workaround: it is the only way
    // to reach this branch, since the real trigger is a 404 from a CDN.
    fireEvent.error(img);

    expect(screen.getByText(PLACEHOLDER)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("names the image after the project for screen readers", () => {
    // The alt text is interpolated from `title`, so a rename must follow through
    // to assistive tech rather than leaving a stale description behind.
    render(<ProjectThumbnail imageUrl="https://example.com/a.png" title="Weather App" />);

    expect(screen.getByAltText("Screenshot of Weather App")).toBeInTheDocument();
  });
});
