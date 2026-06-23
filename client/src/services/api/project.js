import api from "./client";

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
