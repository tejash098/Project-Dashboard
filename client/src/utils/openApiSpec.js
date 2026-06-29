import {
  API_OVERVIEW,
  ENDPOINTS,
  ENDPOINT_GROUPS,
  DATA_MODELS,
} from "../data/apiDocs.js";

/**
 * Best-effort mapping of the freeform `type` strings used in `apiDocs.js`
 * (e.g. `"string"`, `"number"`, `"string[]"`, `'"active" | "completed"'`) to an
 * OpenAPI primitive type. Anything unrecognized falls back to `"string"`.
 * @param {string} typeStr - The documented field/param type.
 * @returns {"string"|"number"|"boolean"|"array"} The OpenAPI `type`.
 */
const mapType = (typeStr) => {
  const t = String(typeStr).toLowerCase();
  if (t.includes("[]") || t.includes("array")) return "array";
  if (t.includes("bool")) return "boolean";
  if (t.includes("number") || t.includes("int")) return "number";
  return "string";
};

/**
 * Turn an endpoint id into a short, human-readable operation summary.
 * e.g. "list-projects" → "List projects".
 * @param {string} id - The endpoint's `id`.
 * @returns {string} A capitalized, spaced summary.
 */
const humanize = (id) => {
  const spaced = id.replace(/-/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/** OpenAPI `type` (array gets an `items` so the schema validates). */
const schemaForType = (typeStr) => {
  const type = mapType(typeStr);
  return type === "array" ? { type, items: { type: "string" } } : { type };
};

/**
 * Build a `components.schemas` entry from a data-model definition.
 * @param {{ rows: Array<{ field: string, type: string, required: boolean, notes: string }> }} model
 * @returns {object} An OpenAPI object schema.
 */
const schemaFromModel = ({ rows }) => {
  const properties = {};
  for (const { field, type, notes } of rows) {
    properties[field] = { ...schemaForType(type), description: notes };
  }
  const required = rows.filter((r) => r.required).map((r) => r.field);
  return required.length
    ? { type: "object", properties, required }
    : { type: "object", properties };
};

/**
 * Convert one endpoint into an OpenAPI Operation Object.
 * @param {import("../data/apiDocs.js").ENDPOINTS[number]} endpoint
 * @returns {object} The operation (to slot under paths[path][method]).
 */
const operationFromEndpoint = (endpoint) => {
  const {
    id,
    description,
    auth,
    group,
    queryParams,
    pathParams,
    requestBody,
    responseExample,
    statusCodes,
  } = endpoint;

  // Path params first, then query params — each as an OpenAPI Parameter Object.
  const parameters = [
    ...(pathParams ?? []).map((p) => ({
      name: p.name,
      in: "path",
      required: true,
      schema: schemaForType(p.type),
      description: p.description,
    })),
    ...(queryParams ?? []).map((p) => ({
      name: p.name,
      in: "query",
      required: false,
      schema: schemaForType(p.type),
      description: p.description,
    })),
  ];

  // Build a response per documented status code; attach the example payload to
  // the first 2xx (success) code so "Try it out" / the model viewer shows it.
  const successCode = statusCodes.find((s) => s.code >= 200 && s.code < 300)?.code;
  const responses = {};
  for (const { code, meaning } of statusCodes) {
    responses[code] =
      code === successCode
        ? {
            description: meaning,
            content: { "application/json": { example: responseExample } },
          }
        : { description: meaning };
  }

  const operation = {
    operationId: id,
    tags: [group],
    summary: humanize(id),
    description,
    responses,
  };

  if (parameters.length) operation.parameters = parameters;
  if (auth) operation.security = [{ bearerAuth: [] }];
  if (requestBody) {
    operation.requestBody = {
      required: true,
      content: { "application/json": { example: requestBody } },
    };
  }

  return operation;
};

/**
 * Build a complete OpenAPI 3.0.3 document from the documentation data in
 * `apiDocs.js`. Keeping this a pure transform (no React/DOM) means the Swagger UI
 * view stays in sync with the rendered Docs page and the served Markdown — they
 * all derive from the same source of truth.
 *
 * @returns {object} An OpenAPI 3.0.3 specification object for `<SwaggerUI spec />`.
 */
export const buildOpenApiSpec = () => {
  // Group operations by path (converting Express `:param` → OpenAPI `{param}`),
  // then by lowercased HTTP method.
  const paths = {};
  for (const endpoint of ENDPOINTS) {
    const path = endpoint.path.replace(/:([A-Za-z]+)/g, "{$1}");
    const method = endpoint.method.toLowerCase();
    paths[path] = paths[path] ?? {};
    paths[path][method] = operationFromEndpoint(endpoint);
  }

  // One reusable schema per documented resource (name = title without spaces).
  const schemas = {};
  for (const model of DATA_MODELS) {
    schemas[model.title.replace(/\s+/g, "")] = schemaFromModel(model);
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "Project Dashboard API",
      description: API_OVERVIEW.intro,
      version: "1.0.0",
    },
    servers: [{ url: API_OVERVIEW.baseUrl }],
    tags: ENDPOINT_GROUPS.map((name) => ({ name })),
    paths,
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas,
    },
  };
};
