/**
 * API documentation, modeled as data.
 *
 * The Docs page is a thin renderer over these exports — adding or changing an
 * endpoint means editing an object here, not rewriting JSX. This mirrors the
 * data-driven pattern used by `navItems` and the projects list. Every value
 * below is sourced from the live API in `server/src` (controllers, routes,
 * models, and middleware).
 */

/**
 * High-level intro shown at the top of the page.
 * @type {{ baseUrl: string, intro: string, envelopeText: string, envelopeExample: object }}
 */
export const API_OVERVIEW = {
  baseUrl: "https://project-dashboard-m5mk.onrender.com",
  intro:
    "The Project Dashboard API is a small REST service for managing portfolio " +
    "projects. Reads are public; writes require an admin bearer token. All " +
    "responses are JSON and share a consistent envelope so clients can handle " +
    "success and failure uniformly.",
  envelopeText:
    "Every response is wrapped in an envelope with a `status` field. Success " +
    'responses use `status: "success"` and carry their payload under `data` ' +
    "(list responses additionally include `total` and `count`). Error " +
    'responses use `status: "error"` and a human-readable `message`.',
  // Representative success + error envelopes for a side-by-side CodeBlock.
  envelopeExample: {
    success: {
      status: "success",
      data: {
        /* resource or array */
      },
    },
    error: { status: "error", message: "Project not found" },
  },
};

/**
 * Authentication reference — how to obtain and present a token.
 * @type {{ headerFormat: string, tokenTtl: string, loginRequest: object, loginResponse: object }}
 */
export const AUTH_INFO = {
  headerFormat: "Authorization: Bearer <token>",
  tokenTtl: "7 days",
  loginRequest: {
    username: "admin",
    password: "your-password",
  },
  loginResponse: {
    status: "success",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    admin: {
      _id: "665f1c2e9b1e4a0012a3b4c5",
      username: "admin",
      email: "admin@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      fullName: "Ada Lovelace",
      role: "admin",
    },
  },
};

/**
 * Every endpoint the API exposes. Each object drives one EndpointCard.
 * `group` lets the page bucket endpoints by resource; `auth` toggles the
 * protected/public indicator; optional `queryParams`, `pathParams`, and
 * `requestBody` render conditionally.
 *
 * @type {Array<{
 *   id: string, method: "GET"|"POST"|"PUT"|"DELETE", path: string,
 *   description: string, auth: boolean, group: "Auth"|"Projects",
 *   queryParams?: Array<{ name: string, type: string, description: string }>,
 *   pathParams?: Array<{ name: string, type: string, description: string }>,
 *   requestBody?: object|null, responseExample: object,
 *   statusCodes: Array<{ code: number, meaning: string }>,
 * }>}
 */
export const ENDPOINTS = [
  // ── Auth ──────────────────────────────────────────────────────────────
  {
    id: "login",
    method: "POST",
    path: "/api/auth/login",
    description:
      "Authenticate an admin by username + password and receive a signed JWT " +
      "plus the admin profile. The token is valid for 7 days.",
    auth: false,
    group: "Auth",
    requestBody: {
      username: "admin",
      password: "your-password",
    },
    responseExample: {
      status: "success",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      admin: {
        _id: "665f1c2e9b1e4a0012a3b4c5",
        username: "admin",
        role: "admin",
      },
    },
    statusCodes: [
      { code: 200, meaning: "Authenticated — token issued" },
      { code: 400, meaning: "Missing username or password" },
      { code: 401, meaning: "Invalid username or password" },
      { code: 500, meaning: "Server error" },
    ],
  },
  {
    id: "me",
    method: "GET",
    path: "/api/auth/me",
    description:
      "Return the profile of the currently authenticated admin. Requires a " +
      "valid bearer token; used by the client to render the profile menu.",
    auth: true,
    group: "Auth",
    responseExample: {
      status: "success",
      admin: {
        _id: "665f1c2e9b1e4a0012a3b4c5",
        username: "admin",
        email: "admin@example.com",
        fullName: "Ada Lovelace",
        role: "admin",
      },
    },
    statusCodes: [
      { code: 200, meaning: "Success" },
      { code: 401, meaning: "Missing, invalid, or expired token" },
      { code: 404, meaning: "Admin no longer exists" },
      { code: 500, meaning: "Server error" },
    ],
  },

  // ── Projects ──────────────────────────────────────────────────────────
  {
    id: "list-projects",
    method: "GET",
    path: "/api/projects",
    description:
      "Fetch all projects. Supports optional filtering, capping, and sorting " +
      "via query parameters. The response includes `total` (all matches) and " +
      "`count` (rows returned after the limit).",
    auth: false,
    group: "Projects",
    queryParams: [
      {
        name: "status",
        type: "string",
        description: "Filter by 'active' or 'completed'. Omit to return all.",
      },
      {
        name: "limit",
        type: "number",
        description: "Cap the number of results (default 100).",
      },
      {
        name: "sort",
        type: "string",
        description:
          "Order by creation_time | -creation_time | updation_time | " +
          "-updation_time (default -creation_time, newest first).",
      },
    ],
    responseExample: {
      status: "success",
      total: 12,
      count: 12,
      data: [
        {
          _id: "665f1c2e9b1e4a0012a3b4c5",
          slug: "project-dashboard",
          title: "Project Dashboard",
          description: "A themed dashboard for managing portfolio projects.",
          status: "active",
          techStack: ["React", "Express", "MongoDB"],
          tags: ["fullstack"],
          featured: true,
          createdAt: "2026-06-01T10:00:00.000Z",
          updatedAt: "2026-06-10T12:30:00.000Z",
        },
      ],
    },
    statusCodes: [
      { code: 200, meaning: "Success" },
      { code: 500, meaning: "Server error" },
    ],
  },
  {
    id: "get-project",
    method: "GET",
    path: "/api/projects/:slug",
    description: "Fetch a single project by its URL slug.",
    auth: false,
    group: "Projects",
    pathParams: [
      {
        name: "slug",
        type: "string",
        description: "The project's unique URL-facing identifier.",
      },
    ],
    responseExample: {
      status: "success",
      data: {
        _id: "665f1c2e9b1e4a0012a3b4c5",
        slug: "project-dashboard",
        title: "Project Dashboard",
        description: "A themed dashboard for managing portfolio projects.",
        status: "active",
        techStack: ["React", "Express", "MongoDB"],
        liveUrl: "https://example.com",
        repoUrl: "https://github.com/example/project-dashboard",
        featured: true,
        tags: ["fullstack"],
        createdAt: "2026-06-01T10:00:00.000Z",
        updatedAt: "2026-06-10T12:30:00.000Z",
      },
    },
    statusCodes: [
      { code: 200, meaning: "Success" },
      { code: 404, meaning: "No project with that slug" },
      { code: 500, meaning: "Server error" },
    ],
  },
  {
    id: "create-project",
    method: "POST",
    path: "/api/projects",
    description:
      "Create a new project. Requires admin auth. `slug`, `title`, and " +
      "`description` are required; all other fields are optional.",
    auth: true,
    group: "Projects",
    requestBody: {
      slug: "new-project",
      title: "New Project",
      description: "What this project is about.",
      status: "active",
      techStack: ["React", "Tailwind"],
      liveUrl: "https://example.com",
      repoUrl: "https://github.com/example/new-project",
      featured: false,
      tags: ["frontend"],
    },
    responseExample: {
      status: "success",
      data: {
        _id: "665f1c2e9b1e4a0012a3b4c6",
        slug: "new-project",
        title: "New Project",
        description: "What this project is about.",
        status: "active",
        techStack: ["React", "Tailwind"],
        featured: false,
        tags: ["frontend"],
        createdAt: "2026-06-20T09:00:00.000Z",
        updatedAt: "2026-06-20T09:00:00.000Z",
      },
    },
    statusCodes: [
      { code: 201, meaning: "Created" },
      { code: 400, meaning: "Validation failed (missing/invalid fields)" },
      { code: 401, meaning: "Missing, invalid, or expired token" },
    ],
  },
  {
    id: "update-project",
    method: "PUT",
    path: "/api/projects/:slug",
    description:
      "Update an existing project by slug, returning the updated document. " +
      "Requires admin auth. Send only the fields you want to change.",
    auth: true,
    group: "Projects",
    pathParams: [
      {
        name: "slug",
        type: "string",
        description: "Slug of the project to update.",
      },
    ],
    requestBody: {
      status: "completed",
      featured: true,
    },
    responseExample: {
      status: "success",
      data: {
        _id: "665f1c2e9b1e4a0012a3b4c5",
        slug: "project-dashboard",
        title: "Project Dashboard",
        status: "completed",
        featured: true,
        updatedAt: "2026-06-20T11:00:00.000Z",
      },
    },
    statusCodes: [
      { code: 200, meaning: "Updated" },
      { code: 400, meaning: "Validation failed" },
      { code: 401, meaning: "Missing, invalid, or expired token" },
      { code: 404, meaning: "No project with that slug" },
    ],
  },
  {
    id: "delete-project",
    method: "DELETE",
    path: "/api/projects/:slug",
    description:
      "Delete a project by slug. Requires admin auth. Returns a confirmation " +
      "message rather than a `data` payload.",
    auth: true,
    group: "Projects",
    pathParams: [
      {
        name: "slug",
        type: "string",
        description: "Slug of the project to delete.",
      },
    ],
    responseExample: {
      status: "success",
      message: "Project deleted successfully",
    },
    statusCodes: [
      { code: 200, meaning: "Deleted" },
      { code: 401, meaning: "Missing, invalid, or expired token" },
      { code: 404, meaning: "No project with that slug" },
      { code: 500, meaning: "Server error" },
    ],
  },
];

/**
 * The Project schema, field by field — drives the Data Model table.
 * Mirrors `server/src/models/Project.js` (plus Mongoose-managed fields).
 *
 * @type {Array<{ field: string, type: string, required: boolean, notes: string }>}
 */
export const PROJECT_MODEL = [
  {
    field: "_id",
    type: "string",
    required: false,
    notes: "MongoDB document id, assigned automatically.",
  },
  {
    field: "slug",
    type: "string",
    required: true,
    notes: "Unique, lowercased URL identifier (used in routes and as the key).",
  },
  { field: "title", type: "string", required: true, notes: "Display name." },
  {
    field: "description",
    type: "string",
    required: true,
    notes: "Full project summary.",
  },
  {
    field: "status",
    type: '"active" | "completed"',
    required: false,
    notes: 'Project state. Defaults to "active".',
  },
  {
    field: "techStack",
    type: "string[]",
    required: false,
    notes: "Technologies used. Defaults to an empty array.",
  },
  {
    field: "liveUrl",
    type: "string",
    required: false,
    notes: "Live demo URL, if any.",
  },
  {
    field: "repoUrl",
    type: "string",
    required: false,
    notes: "Source repository URL, if any.",
  },
  {
    field: "featured",
    type: "boolean",
    required: false,
    notes: "Whether to highlight the project. Defaults to false.",
  },
  {
    field: "imageUrl",
    type: "string",
    required: false,
    notes: "Thumbnail path, if any.",
  },
  {
    field: "tags",
    type: "string[]",
    required: false,
    notes: "Freeform category tags. Defaults to an empty array.",
  },
  {
    field: "createdAt",
    type: "string (ISO)",
    required: false,
    notes: "Creation timestamp, managed by Mongoose.",
  },
  {
    field: "updatedAt",
    type: "string (ISO)",
    required: false,
    notes: "Last-update timestamp, managed by Mongoose.",
  },
];

/**
 * Global status-code conventions used across the API.
 * @type {Array<{ code: number, meaning: string }>}
 */
export const STATUS_CODES = [
  { code: 200, meaning: "OK — request succeeded (GET, PUT, DELETE)." },
  { code: 201, meaning: "Created — a new resource was created (POST)." },
  {
    code: 400,
    meaning: "Bad Request — validation failed or required fields are missing.",
  },
  {
    code: 401,
    meaning:
      "Unauthorized — missing/invalid/expired token, or bad credentials.",
  },
  { code: 404, meaning: "Not Found — no resource matches the identifier." },
  { code: 500, meaning: "Server Error — an unexpected failure occurred." },
];
