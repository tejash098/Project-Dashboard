import axios from "axios";

/**
 * @typedef {Object} Project
 * @property {string}   _id         - MongoDB document id.
 * @property {string}   slug        - URL-facing identifier (used in routes and as React key).
 * @property {string}   title       - Display name.
 * @property {string}   description - Full project summary.
 * @property {"active"|"completed"} status - Current project state.
 * @property {string[]} techStack   - Technologies used.
 * @property {string}   [liveUrl]   - Live demo URL, if any.
 * @property {string}   [repoUrl]   - Source repository URL, if any.
 * @property {boolean}  featured    - Whether to highlight this project.
 * @property {string}   [imageUrl]  - Thumbnail path, if any.
 * @property {string[]} tags        - Freeform category tags.
 * @property {string}   createdAt   - ISO timestamp, set by Mongoose.
 * @property {string}   updatedAt   - ISO timestamp, set by Mongoose.
 */

/**
 * Shared axios instance pointed at the projects API. The base URL comes from
 * SERVER_BASE_URL, exposed to the client via the `SERVER_` envPrefix in
 * vite.config.js. The API wraps payloads as `{ status, data }`, and axios nests
 * the HTTP body under `res.data` — so the payload lives at `res.data.data`.
 */
const api = axios.create({
  baseURL: import.meta.env.SERVER_BASE_URL,
});

/** localStorage keys for the persisted auth session. */
export const AUTH_TOKEN_KEY = "auth_token";
export const AUTH_ADMIN_KEY = "auth_admin";

/**
 * Request interceptor — attach the bearer token to every outgoing request.
 * We read it from localStorage (not React state) so this module stays free of
 * React imports and avoids a circular dependency with AuthContext: the context
 * writes the token to storage, this interceptor reads it back.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Trace every outgoing request + whether it carries auth (never log the token).
  console.log(
    `[api] → ${config.method?.toUpperCase()} ${config.url} ${token ? "(auth)" : "(anon)"}`,
  );
  return config;
});

/**
 * Response interceptor — on a 401 (missing/expired/invalid token) clear the
 * persisted session and broadcast `auth:unauthorized` so AuthContext can flip
 * the app back to a logged-out state. The rejection still propagates so the
 * calling code can handle the error too.
 */
api.interceptors.response.use(
  (res) => {
    console.log(`[api] ← ${res.status} ${res.config.url}`);
    return res;
  },
  (error) => {
    const status = error.response?.status;
    console.error(
      `[api] ✕ ${status ?? "network"} ${error.config?.url ?? ""}: ${error.message}`,
    );
    if (status === 401) {
      console.warn("[api] 401 → clearing session, broadcasting auth:unauthorized");
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_ADMIN_KEY);
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    return Promise.reject(error);
  },
);

/**
 * Fetch every project.
 * @returns {Promise<Project[]>} All projects (newest first per the API default).
 * @throws {Error} On network failure or a non-2xx response (axios rejects).
 */
export const fetchProjects = async () => {
  const res = await api.get("/projects");
  return res.data.data;
};

/**
 * Fetch a single project by its slug.
 * @param {string} slug - Project slug to look up.
 * @returns {Promise<Project>} The matching project.
 * @throws {Error} On a 404 (unknown slug) or other non-2xx response, so callers
 *   can render a not-found state.
 */
export const fetchProjectBySlug = async (slug) => {
  const res = await api.get(`/projects/${slug}`);
  return res.data.data;
};

/**
 * Create a new project. axios serializes the object body and sets the
 * Content-Type: application/json header automatically.
 * @param {Partial<Project>} data - New project fields.
 * @returns {Promise<Project>} The created project.
 * @throws {Error} On validation failure (400) or other non-2xx response.
 */
export const createProject = async (data) => {
  const res = await api.post("/projects", data);
  return res.data.data;
};

/**
 * Update an existing project by slug.
 * @param {string} slug - Slug of the project to update.
 * @param {Partial<Project>} data - Fields to change.
 * @returns {Promise<Project>} The updated project.
 * @throws {Error} On a 404, validation failure (400), or other non-2xx response.
 */
export const updateProject = async (slug, data) => {
  const res = await api.put(`/projects/${slug}`, data);
  return res.data.data;
};

/**
 * Delete a project by slug.
 * @param {string} slug - Slug of the project to delete.
 * @returns {Promise<{ status: string, message: string }>} The API confirmation
 *   body (this endpoint returns no `data` payload).
 * @throws {Error} On a 404 or other non-2xx response.
 */
export const deleteProject = async (slug) => {
  const res = await api.delete(`/projects/${slug}`);
  return res.data;
};

/**
 * @typedef {Object} Admin
 * @property {string}  _id        - MongoDB document id.
 * @property {string}  username   - Login identifier.
 * @property {string}  [email]    - Contact email, if set.
 * @property {string}  [firstName]- Given name, if set.
 * @property {string}  [lastName] - Family name, if set.
 * @property {string}  fullName   - Virtual: first + last (may be empty).
 * @property {"admin"} role       - Account role.
 */

/**
 * Authenticate an admin by username + password.
 * @param {string} username - Admin username.
 * @param {string} password - Admin password.
 * @returns {Promise<{ token: string, admin: Admin }>} The signed JWT and admin profile.
 * @throws {Error} On bad credentials (401) or other non-2xx response.
 */
export const loginRequest = async (username, password) => {
  const res = await api.post("/auth/login", { username, password });
  return { token: res.data.token, admin: res.data.admin };
};

/**
 * Fetch the currently authenticated admin's profile. Relies on the request
 * interceptor to attach the bearer token. A 401 (expired/invalid token) rejects
 * and triggers the auto-logout flow via the response interceptor.
 * @returns {Promise<Admin>} The authenticated admin profile.
 * @throws {Error} On a 401/404 or other non-2xx response.
 */
export const fetchMe = async () => {
  const res = await api.get("/auth/me");
  return res.data.admin;
};
