import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "../components/ui/Footer.jsx";
import { FULL_NAME } from "../config/profile.js";

/** Footer renders a router Link, so it needs a Router above it to mount at all. */
const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );

/**
 * The footer is the only thing on most pages that says this dashboard is a
 * portfolio piece rather than a product, and its single link is the whole route
 * from "who built this" to the About page. Both are easy to break silently —
 * nothing else in the app would fail if the copy or the href went missing.
 */
describe("Footer", () => {
  it("explains both reasons the project exists", () => {
    renderFooter();

    // The learning motive and the recruiter motive have to survive together;
    // trimming the copy down to one of them loses half the point.
    const purpose = screen.getByText(/learn full-stack development end to end/i);
    expect(purpose).toHaveTextContent(/recruiters/i);
  });

  it("links to the About page", () => {
    renderFooter();

    // Queried by role and name rather than test id: a footer whose one link is
    // unreachable or mislabelled is worse than no footer at all.
    const link = screen.getByRole("link", { name: /more about me/i });
    expect(link).toHaveAttribute("href", "/about");
  });

  it("credits the author using the shared profile constant", () => {
    renderFooter();

    // Built from FULL_NAME and the live year rather than a hard-coded string, so
    // this can't drift from the value About.jsx renders in its greeting.
    expect(
      screen.getByText(`© ${new Date().getFullYear()} ${FULL_NAME}`),
    ).toBeInTheDocument();
  });

  it("exposes its heading to assistive tech", () => {
    renderFooter();

    expect(
      screen.getByRole("heading", { name: "About this project" }),
    ).toBeInTheDocument();
  });
});
