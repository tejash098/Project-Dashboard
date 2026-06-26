import api from "./client";

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

/**
 * Create a new admin. Admin-only — the bearer token is attached by the request
 * interceptor and the server rejects unauthenticated callers with 401.
 * @param {{ username: string, password: string, email?: string, firstName?: string, lastName?: string }} payload - New admin fields.
 * @returns {Promise<Admin>} The created admin profile (without the password hash).
 * @throws {Error} On validation/duplicate (400) or auth (401) failure.
 */
export const createAdmin = async (payload) => {
  const res = await api.post("/auth/admins", payload);
  return res.data.admin;
};

/**
 * Update an existing admin by id. Admin-only. Omit `password` (or send it empty)
 * to leave the current password unchanged.
 * @param {string} id - The admin's `_id`.
 * @param {{ username?: string, email?: string, firstName?: string, lastName?: string, password?: string }} payload - Fields to change.
 * @returns {Promise<Admin>} The updated admin profile.
 * @throws {Error} On validation/duplicate (400), auth (401), or not-found (404).
 */
export const updateAdmin = async (id, payload) => {
  const res = await api.put(`/auth/admins/${id}`, payload);
  return res.data.admin;
};
