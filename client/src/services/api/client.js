import axios from "axios";
import { startRequest, endRequest } from "./slowRequestMonitor";

/**
 * How long to wait before giving up on a request.
 *
 * Deliberately generous. The API runs on a free instance that spins down when
 * idle, and a cold start can take the better part of a minute — a conventional
 * 10-30s ceiling would abort exactly the requests the cold-start toast exists to
 * sit through. 90s clears the worst case while still letting a genuinely dead
 * server fail with a real error, which axios's default (no timeout at all) never
 * does: it just hangs forever.
 */
const REQUEST_TIMEOUT_MS = 90_000;

/**
 * How many times a GET is re-sent when it never reached the server. Pages
 * fetch once on mount, so without this a page loaded while the API is still
 * booting (connecting to MongoDB and Redis, a few seconds) stays on its error
 * state until a manual reload — even after the server comes up.
 */
const MAX_RETRIES = 4;

/** First retry delay; it doubles each attempt (1s, 2s, 4s, 8s ≈ 15s in all). */
const RETRY_BASE_DELAY_MS = 1_000;

/**
 * Whether a failed request should be re-sent. Only GETs (safe to repeat) that
 * got no response at all — connection refused, DNS, network down. Excluded:
 * timeouts, which already waited 90s; cancellations, which aren't failures;
 * and any HTTP status, since the server answered and repeating won't change
 * that (our 503 means "GitHub rate limit, try in an hour").
 * @param {import("axios").AxiosError} error - The rejected request.
 * @returns {boolean} True when another attempt is worthwhile.
 */
const shouldRetry = (error) =>
  error.config?.method === "get" &&
  !error.response &&
  !axios.isCancel(error) &&
  error.code !== "ECONNABORTED" &&
  error.code !== "ETIMEDOUT" &&
  (error.config.retryCount ?? 0) < MAX_RETRIES;

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
  timeout: REQUEST_TIMEOUT_MS,
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
  // Start the slow-request clock before anything else, so the cold-start toast
  // measures the full wait rather than missing its head.
  startRequest();

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
 * Response interceptor — re-sends GETs that never reached the server (see
 * shouldRetry). On a 401 (missing/expired/invalid token) it clears the
 * persisted session and broadcasts `auth:unauthorized` so AuthContext can flip
 * the app back to a logged-out state. The rejection still propagates so the
 * calling code can handle the error too.
 */
api.interceptors.response.use(
  (res) => {
    endRequest();
    console.log(`[api] ← ${res.status} ${res.config.url}`);
    return res;
  },
  async (error) => {
    // Settled either way — a failed request still ends the wait, so this runs
    // before any of the status branches below can return.
    endRequest();

    const status = error.response?.status;
    console.error(
      `[api] ✕ ${status ?? "network"} ${error.config?.url ?? ""}: ${error.message}`,
    );

    // Server not reachable yet — back off and re-send. Returning the retry
    // makes it the caller's result, so callers never see the failed attempts,
    // and the unreachable toast below only fires once retries run out.
    if (shouldRetry(error)) {
      const attempt = (error.config.retryCount ?? 0) + 1;
      const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `[api] retry ${attempt}/${MAX_RETRIES} for ${error.config.url} in ${delay}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api({ ...error.config, retryCount: attempt });
    }
    if (status === 401) {
      console.warn("[api] 401 → clearing session, broadcasting auth:unauthorized");
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_ADMIN_KEY);
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    // Rate-limited — broadcast so ToastProvider can show the server's message
    // without every page needing its own 429 handler.
    if (status === 429) {
      const message =
        error.response?.data?.message || "Too many requests. Please slow down.";
      console.warn(`[api] 429 → rate limited: ${message}`);
      window.dispatchEvent(
        new CustomEvent("api:rate-limited", { detail: { message } }),
      );
    }
    // Timed out, or no response at all — the server is unreachable rather than
    // refusing us, so there is no status and no server message to surface. Say
    // so in plain language; otherwise pages fall back to `err.message` and show
    // axios's raw "timeout of 90000ms exceeded". A cancelled request is excluded:
    // it also carries no response, but nothing went wrong.
    if (
      !axios.isCancel(error) &&
      (error.code === "ECONNABORTED" || !error.response)
    ) {
      console.warn("[api] unreachable → broadcasting api:unreachable");
      window.dispatchEvent(
        new CustomEvent("api:unreachable", {
          detail: { message: "Couldn't reach the server. Please try again." },
        }),
      );
    }
    return Promise.reject(error);
  },
);

export default api;
