import { useMemo } from "react";
import PageLayout from "../layouts/PageLayout";
import Card from "../components/ui/Card";
import CodeBlock from "../components/ui/CodeBlock";
import CopyPageMenu from "../components/ui/CopyPageMenu";
import EndpointCard from "../components/ui/EndpointCard";
import {
  API_OVERVIEW,
  AUTH_INFO,
  ENDPOINTS,
  PROJECT_MODEL,
  STATUS_CODES,
} from "../data/apiDocs";
import { buildDocsMarkdown } from "../utils/docsMarkdown";
import { ROUNDED, TYPOGRAPHY } from "../config/constants";

/** Public URL where the backend serves this page as raw Markdown. */
const DOCS_MD_URL = `${import.meta.env.SERVER_BASE_URL}/docs.md`;

/** In-page nav targets — label + the section `id` each anchors to. */
const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "authentication", label: "Authentication" },
  { id: "endpoints", label: "Endpoints" },
  { id: "data-model", label: "Data Model" },
  { id: "status-codes", label: "Status Codes" },
];

/** Resource groups, in display order, used to bucket the endpoint cards. */
const GROUPS = ["Auth", "Projects"];

/**
 * Section heading with an anchor id, shared across the page so the in-page nav
 * can jump to each block.
 *
 * @param {Object} props
 * @param {string} props.id       - Anchor id matched by the in-page nav.
 * @param {string} props.title    - Section title.
 * @param {string} [props.subtitle] - Optional one-line description.
 */
const Section = ({ id, title, subtitle, children }) => (
  <section id={id} className="scroll-mt-6 mt-10 first:mt-0">
    <h2
      className={`${TYPOGRAPHY.TEXT_2XL} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}
    >
      {title}
    </h2>
    {subtitle && (
      <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-1`}>
        {subtitle}
      </p>
    )}
    <div className="mt-4">{children}</div>
  </section>
);

/**
 * API Documentation page. Renders entirely from the data in `apiDocs.js`, so
 * documenting a new endpoint is a data change, not a JSX change. Assembles the
 * overview, authentication, grouped endpoint cards, the Project data model, and
 * the global status-code conventions.
 */
const Docs = () => {
  // Render the page to Markdown once — used by "Copy page" / "View as Markdown".
  const markdown = useMemo(() => buildDocsMarkdown(), []);

  return (
    <PageLayout
      title="API Documentation"
      subtitle="Reference for the Project Dashboard REST API"
      actions={<CopyPageMenu markdown={markdown} markdownUrl={DOCS_MD_URL} />}
    >
      {/* ── In-page nav — quick jumps to each section ── */}
      <nav className="flex flex-wrap gap-2 mb-8">
        {SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className={`px-3 py-1.5 ${ROUNDED.MD} ${TYPOGRAPHY.TEXT_SM}
              ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary
              hover:bg-accent-subtle hover:text-accent transition-colors duration-200`}
          >
            {label}
          </a>
        ))}
      </nav>

      {/* ── Overview — intro, base URL, response envelope ── */}
      <Section id="overview" title="Overview">
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
          {API_OVERVIEW.intro}
        </p>

        <h3
          className={`${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary mt-6 mb-2`}
        >
          Base URL
        </h3>
        <CodeBlock content={API_OVERVIEW.baseUrl} />

        <h3
          className={`${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary mt-6 mb-2`}
        >
          Response envelope
        </h3>
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mb-3`}>
          {API_OVERVIEW.envelopeText}
        </p>
        <CodeBlock content={API_OVERVIEW.envelopeExample} />
      </Section>

      {/* ── Authentication — login flow + bearer header ── */}
      <Section id="authentication" title="Authentication">
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
          Obtain a token from{" "}
          <code className="font-mono">POST /api/auth/login</code>, then send it
          on protected requests using the{" "}
          <code className="font-mono">Authorization</code> header. Tokens are
          valid for {AUTH_INFO.tokenTtl}; once expired, log in again.
        </p>

        <h3
          className={`${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary mt-6 mb-2`}
        >
          Authorization header
        </h3>
        <CodeBlock content={AUTH_INFO.headerFormat} />

        <h3
          className={`${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary mt-6 mb-2`}
        >
          Login request
        </h3>
        <CodeBlock content={AUTH_INFO.loginRequest} />

        <h3
          className={`${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary mt-6 mb-2`}
        >
          Login response
        </h3>
        <CodeBlock content={AUTH_INFO.loginResponse} />
      </Section>

      {/* ── Endpoints — grouped by resource, one card each ── */}
      <Section
        id="endpoints"
        title="Endpoints"
        subtitle="Reads are public; writes require an admin bearer token."
      >
        {GROUPS.map((group) => {
          const groupEndpoints = ENDPOINTS.filter((e) => e.group === group);
          return (
            <div key={group} className="mt-6 first:mt-0">
              {/* Resource subheading (Auth, Projects). */}
              <h3
                className={`${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary mb-3`}
              >
                {group}
              </h3>
              <div className="flex flex-col gap-4">
                {groupEndpoints.map((endpoint) => (
                  <EndpointCard key={endpoint.id} endpoint={endpoint} />
                ))}
              </div>
            </div>
          );
        })}
      </Section>

      {/* ── Data Model — the Project schema as a table ── */}
      <Section
        id="data-model"
        title="Data Model"
        subtitle="Fields of the Project resource."
      >
        <Card>
          <div className="overflow-x-auto">
            <table className={`w-full text-left ${TYPOGRAPHY.TEXT_SM}`}>
              <thead>
                <tr className="border-b border-border">
                  <th
                    className={`py-2 pr-4 ${TYPOGRAPHY.FONT_MEDIUM} text-text-primary`}
                  >
                    Field
                  </th>
                  <th
                    className={`py-2 pr-4 ${TYPOGRAPHY.FONT_MEDIUM} text-text-primary`}
                  >
                    Type
                  </th>
                  <th
                    className={`py-2 pr-4 ${TYPOGRAPHY.FONT_MEDIUM} text-text-primary`}
                  >
                    Required
                  </th>
                  <th
                    className={`py-2 ${TYPOGRAPHY.FONT_MEDIUM} text-text-primary`}
                  >
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {PROJECT_MODEL.map(({ field, type, required, notes }) => (
                  <tr
                    key={field}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-2 pr-4 align-top">
                      <code className="font-mono text-text-primary">
                        {field}
                      </code>
                    </td>
                    <td className="py-2 pr-4 align-top">
                      <code className="font-mono text-text-secondary">
                        {type}
                      </code>
                    </td>
                    <td className="py-2 pr-4 align-top text-text-secondary">
                      {required ? "Yes" : "No"}
                    </td>
                    <td className="py-2 align-top text-text-secondary">
                      {notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* ── Status Codes — global conventions table ── */}
      <Section
        id="status-codes"
        title="Status Codes"
        subtitle="Conventions used across every endpoint."
      >
        <Card>
          <div className="overflow-x-auto">
            <table className={`w-full text-left ${TYPOGRAPHY.TEXT_SM}`}>
              <thead>
                <tr className="border-b border-border">
                  <th
                    className={`py-2 pr-4 ${TYPOGRAPHY.FONT_MEDIUM} text-text-primary`}
                  >
                    Code
                  </th>
                  <th
                    className={`py-2 ${TYPOGRAPHY.FONT_MEDIUM} text-text-primary`}
                  >
                    Meaning
                  </th>
                </tr>
              </thead>
              <tbody>
                {STATUS_CODES.map(({ code, meaning }) => (
                  <tr
                    key={code}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-2 pr-4 align-top">
                      <code className="font-mono text-text-primary">
                        {code}
                      </code>
                    </td>
                    <td className="py-2 align-top text-text-secondary">
                      {meaning}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>
    </PageLayout>
  );
};

export default Docs;
