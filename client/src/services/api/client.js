import axios from "axios";

/**
 * Shared axios instance for the whole API. The base URL comes from
 * SERVER_BASE_URL, exposed to the client via the `SERVER_` envPrefix in
 * vite.config.js. The API wraps payloads as `{ status, data }`, and axios nests
 * the HTTP body under `res.data` — so the payload lives at `res.data.data`.
 *
 * Resource modules (project.js, auth.js, feedback.js) import this instance so
 * the interceptors below apply uniformly to every request.
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

export default api;
