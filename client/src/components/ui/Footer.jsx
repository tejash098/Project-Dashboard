import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FULL_NAME } from "../../config/profile";
import {
  CONTAINER,
  BORDER,
  ROUNDED,
  TYPOGRAPHY,
  WIDTH,
  A11Y,
  ICON_SIZE,
} from "../../config/constants";

/**
 * What this project is, and why it exists.
 *
 * The dashboard reads as a working product, so without saying so nothing signals
 * that it is a portfolio piece — and that story otherwise lives only on the About
 * page, which a visitor has to already know to look for.
 */
const PROJECT_PURPOSE =
  "This dashboard is a personal project I built to learn full-stack development " +
  "end to end — and to give recruiters a working example of how I design, build " +
  "and document software, rather than just a list of skills.";

/**
 * Copyright year, resolved once when the module loads. A tab left open across New
 * Year would show the previous one, which is not worth a re-render to correct.
 */
const YEAR = new Date().getFullYear();

/**
 * Site footer — rendered by AppShell at the end of every page's content, so it
 * reaches every route without a per-page change.
 *
 * Deliberately quiet: one paragraph explaining the project and one link into the
 * About page. The sidebar already reaches every route and the Contact page
 * already holds every channel, so repeating either here would only add noise to
 * the bottom of every page.
 */
const Footer = () => {
  return (
    // A plain <footer> rather than role="contentinfo": this renders inside
    // <main>, and contentinfo is specified as a top-level landmark — nesting one
    // inside another landmark is a violation. The label keeps the region
    // identifiable without claiming a role it isn't entitled to.
    //
    // CONTAINER.MAX_W is what lines the footer up with PageLayout's content
    // column, so its rules start and stop where the page content does.
    //
    // WIDTH.FULL is load-bearing, not decoration: AppShell renders this as a
    // flex-column child, and the `mx-auto` inside CONTAINER.MAX_W overrides the
    // column's default stretch — auto cross-axis margins shrink-wrap a flex item
    // to its content. Without an explicit width the footer collapses to its
    // widest child and centres, so the rules render short and out of line with
    // the page content above them.
    <footer
      aria-label="About this project"
      className={`${WIDTH.FULL} ${CONTAINER.MAX_W} ${BORDER.TOP} mt-10 pt-6`}
    >
      <h2
        className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}
      >
        About this project
      </h2>

      {/* Spans the full content column rather than being capped to a narrower
          measure, so the explanation fills the width of the page above it. */}
      <p
        className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary leading-relaxed mt-2`}
      >
        {PROJECT_PURPOSE}
      </p>

      {/* A router Link, not an anchor — /about is an internal route, and a full
          page reload here would throw away the already-loaded app. */}
      <Link
        to="/about"
        className={`inline-flex items-center gap-1.5 mt-3 ${TYPOGRAPHY.TEXT_SM}
          ${TYPOGRAPHY.FONT_MEDIUM} text-accent hover:opacity-80
          ${A11Y.FOCUS_RING} ${ROUNDED.SM}`}
      >
        More about me
        <ArrowRight size={ICON_SIZE.SM} aria-hidden="true" />
      </Link>

      {/* Centred under the full-width rule, so the credit reads as a closing
          line for the whole footer rather than a fourth left-aligned item. */}
      <p
        className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary text-center ${BORDER.TOP} mt-5 pt-4`}
      >
        © {YEAR} {FULL_NAME}
      </p>
    </footer>
  );
};

export default Footer;
