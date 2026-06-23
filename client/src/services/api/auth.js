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
