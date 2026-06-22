import {
  API_OVERVIEW,
  AUTH_INFO,
  ENDPOINTS,
  PROJECT_MODEL,
  STATUS_CODES,
} from "../data/apiDocs.js";

/**
 * Builds the full API Documentation page as a single Markdown document.
 *
 * This is the same source of truth the React page renders from (`apiDocs.js`),
 * so the rendered page, the "Copy page" action, and the `.md` served by the
 * backend all stay in sync. The function is intentionally free of React/DOM
 * dependencies so it can also run under plain Node (see
 * `client/scripts/generate-docs-md.mjs`).
 *
 * @param {string} [baseUrl] - Public base URL of the deployed page, prepended
 *   to a "View / source" note. Defaults to the API base URL in `apiDocs.js`.
 * @returns {string} The complete documentation rendered as Markdown.
 */
export const buildDocsMarkdown = (baseUrl = API_OVERVIEW.baseUrl) => {
  // Each section pushes its Markdown here; joined with blank lines at the end.
  const blocks = [];

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Pretty-print a value as a fenced JSON code block. */
  const jsonFence = (value) =>
    "```json\n" + JSON.stringify(value, null, 2) + "\n```";

  /** Wrap raw text in a plain (language-less) fenced code block. */
  const codeFence = (text) => "```\n" + text + "\n```";

  /** Escape a value so it is safe to drop inside a Markdown table cell. */
  const cell = (value) =>
    String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");

  /**
   * Render a Markdown table from a header row and an array of row arrays.
   * @param {string[]} headers
   * @param {Array<Array<string|number|boolean>>} rows
   */
  const table = (headers, rows) => {
    const head = `| ${headers.join(" | ")} |`;
    const divider = `| ${headers.map(() => "---").join(" | ")} |`;
    const body = rows
      .map((row) => `| ${row.map(cell).join(" | ")} |`)
      .join("\n");
    return [head, divider, body].join("\n");
  };

  // ── Title ─────────────────────────────────────────────────────────────────
  blocks.push("# Project Dashboard API");
  blocks.push("> Reference for the Project Dashboard REST API.");
  blocks.push(`_Source: ${baseUrl}_`);

  // ── Overview ────────────────────────────────────────────────────────────
  blocks.push("## Overview");
  blocks.push(API_OVERVIEW.intro);
  blocks.push("### Base URL");
  blocks.push(codeFence(API_OVERVIEW.baseUrl));
  blocks.push("### Response envelope");
  blocks.push(API_OVERVIEW.envelopeText);
  blocks.push(jsonFence(API_OVERVIEW.envelopeExample));

  // ── Authentication ─────────────────────────────────────────────────────
  blocks.push("## Authentication");
  blocks.push(
    "Obtain a token from `POST /api/auth/login`, then send it on protected " +
      "requests using the `Authorization` header. Tokens are valid for " +
      `${AUTH_INFO.tokenTtl}; once expired, log in again.`,
  );
  blocks.push("### Authorization header");
  blocks.push(codeFence(AUTH_INFO.headerFormat));
  blocks.push("### Login request");
  blocks.push(jsonFence(AUTH_INFO.loginRequest));
  blocks.push("### Login response");
  blocks.push(jsonFence(AUTH_INFO.loginResponse));

  // ── Endpoints — grouped by resource, mirroring the page's GROUPS order ──
  blocks.push("## Endpoints");
  blocks.push("Reads are public; writes require an admin bearer token.");

  for (const group of ["Auth", "Projects"]) {
    blocks.push(`### ${group}`);

    for (const endpoint of ENDPOINTS.filter((e) => e.group === group)) {
      blocks.push(`#### ${endpoint.method} ${endpoint.path}`);
      blocks.push(endpoint.description);
      blocks.push(`**Auth required:** ${endpoint.auth ? "Yes" : "No"}`);

      // Optional parameter / body blocks render only when present.
      if (endpoint.queryParams?.length) {
        blocks.push("**Query parameters**");
        blocks.push(
          table(
            ["Name", "Type", "Description"],
            endpoint.queryParams.map((p) => [p.name, p.type, p.description]),
          ),
        );
      }
      if (endpoint.pathParams?.length) {
        blocks.push("**Path parameters**");
        blocks.push(
          table(
            ["Name", "Type", "Description"],
            endpoint.pathParams.map((p) => [p.name, p.type, p.description]),
          ),
        );
      }
      if (endpoint.requestBody) {
        blocks.push("**Request body**");
        blocks.push(jsonFence(endpoint.requestBody));
      }

      blocks.push("**Response example**");
      blocks.push(jsonFence(endpoint.responseExample));

      blocks.push("**Status codes**");
      blocks.push(
        table(
          ["Code", "Meaning"],
          endpoint.statusCodes.map((s) => [s.code, s.meaning]),
        ),
      );
    }
  }

  // ── Data Model ────────────────────────────────────────────────────────
  blocks.push("## Data Model");
  blocks.push("Fields of the Project resource.");
  blocks.push(
    table(
      ["Field", "Type", "Required", "Notes"],
      PROJECT_MODEL.map((f) => [
        f.field,
        f.type,
        f.required ? "Yes" : "No",
        f.notes,
      ]),
    ),
  );

  // ── Status Codes ──────────────────────────────────────────────────────
  blocks.push("## Status Codes");
  blocks.push("Conventions used across every endpoint.");
  blocks.push(
    table(
      ["Code", "Meaning"],
      STATUS_CODES.map((s) => [s.code, s.meaning]),
    ),
  );

  // Blank line between every block yields clean, readable Markdown.
  return blocks.join("\n\n") + "\n";
};
