import Card from "./Card";
import MethodBadge from "./MethodBadge";
import CodeBlock from "./CodeBlock";
import { ROUNDED, TYPOGRAPHY } from "../../config/constants";

/** @typedef {import("../../data/apiDocs").ENDPOINTS[number]} Endpoint */

/** Small heading shared by each sub-section within the card. */
const SectionLabel = ({ children }) => (
  <h4
    className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_SEMIBOLD}
      uppercase tracking-wide text-text-secondary mb-2`}
  >
    {children}
  </h4>
);

/**
 * Renders a single API endpoint as a section: a header (method, path, auth
 * indicator), description, and conditional blocks for query/path params, request
 * body, response example, and status codes. Composes Card, MethodBadge, and
 * CodeBlock so it stays consistent with the rest of the app.
 *
 * @param {Object}   props
 * @param {Endpoint} props.endpoint - One endpoint object from apiDocs.ENDPOINTS.
 */
const EndpointCard = ({ endpoint }) => {
  const {
    id,
    method,
    path,
    description,
    auth,
    queryParams,
    pathParams,
    requestBody,
    responseExample,
    statusCodes,
  } = endpoint;

  return (
    <Card>
      {/* `id` makes the card an anchor target; `scroll-mt-*` keeps it clear of the top. */}
      <div id={id} className="scroll-mt-6">
        {/* ── Header — method + path + auth indicator ── */}
        <div className="flex flex-wrap items-center gap-3">
          <MethodBadge method={method} />
          <code
            className={`font-mono ${TYPOGRAPHY.TEXT_SM} text-text-primary break-all`}
          >
            {path}
          </code>
          {/* Auth indicator — protected endpoints get a lock; public a plain pill. */}
          <span
            className={`inline-flex items-center ${ROUNDED.FULL} px-2.5 py-0.5
              ${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} ${
                auth
                  ? "bg-accent-subtle text-accent"
                  : "bg-page-bg border border-border text-text-secondary"
              }`}
          >
            {auth ? "🔒 Protected" : "Public"}
          </span>
        </div>

        {/* ── Description ── */}
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-3`}>
          {description}
        </p>

        {/* ── Path params — only when the route has them ── */}
        {pathParams && (
          <div className="mt-4">
            <SectionLabel>Path parameters</SectionLabel>
            <ParamTable params={pathParams} />
          </div>
        )}

        {/* ── Query params — only when the endpoint accepts them ── */}
        {queryParams && (
          <div className="mt-4">
            <SectionLabel>Query parameters</SectionLabel>
            <ParamTable params={queryParams} />
          </div>
        )}

        {/* ── Request body — only for POST/PUT that carry one ── */}
        {requestBody && (
          <div className="mt-4">
            <SectionLabel>Request body</SectionLabel>
            <CodeBlock content={requestBody} />
          </div>
        )}

        {/* ── Response — sample success payload ── */}
        <div className="mt-4">
          <SectionLabel>Response</SectionLabel>
          <CodeBlock content={responseExample} />
        </div>

        {/* ── Status codes — compact, color-coded list ── */}
        <div className="mt-4">
          <SectionLabel>Status codes</SectionLabel>
          <ul className="flex flex-col gap-1">
            {statusCodes.map(({ code, meaning }) => (
              <li
                key={code}
                className={`flex items-baseline gap-2 ${TYPOGRAPHY.TEXT_SM}`}
              >
                <code className="font-mono text-text-primary">{code}</code>
                <span className="text-text-secondary">{meaning}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
};

/**
 * Compact table for query/path parameters — name, type, and description.
 *
 * @param {Object} props
 * @param {Array<{ name: string, type: string, description: string }>} props.params -
 *   Parameter definitions to render as rows.
 */
const ParamTable = ({ params }) => (
  <div className="overflow-x-auto">
    <table className={`w-full text-left ${TYPOGRAPHY.TEXT_SM}`}>
      <thead>
        <tr className="border-b border-border">
          <th className={`py-2 pr-4 ${TYPOGRAPHY.FONT_MEDIUM} text-text-primary`}>
            Name
          </th>
          <th className={`py-2 pr-4 ${TYPOGRAPHY.FONT_MEDIUM} text-text-primary`}>
            Type
          </th>
          <th className={`py-2 ${TYPOGRAPHY.FONT_MEDIUM} text-text-primary`}>
            Description
          </th>
        </tr>
      </thead>
      <tbody>
        {params.map(({ name, type, description }) => (
          <tr key={name} className="border-b border-border last:border-0">
            <td className="py-2 pr-4 align-top">
              <code className="font-mono text-text-primary">{name}</code>
            </td>
            <td className="py-2 pr-4 align-top">
              <code className="font-mono text-text-secondary">{type}</code>
            </td>
            <td className="py-2 align-top text-text-secondary">{description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default EndpointCard;
