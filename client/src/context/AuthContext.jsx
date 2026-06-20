import { createContext, useState, useEffect, useCallback } from "react";
import {
  loginRequest,
  fetchMe,
  AUTH_TOKEN_KEY,
  AUTH_ADMIN_KEY,
} from "../services/api";
import { isTokenExpired } from "../lib/jwt";

/**
 * Context object for authentication + view-mode state.
 * Consumed via the useAuth hook.
 */
export const AuthContext = createContext();

/**
 * Read the persisted token from localStorage, discarding it if already expired.
 * @returns {string|null} A still-valid token, or null.
 */
const readStoredToken = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token || isTokenExpired(token)) return null;
  return token;
};

/**
 * Read the persisted admin profile from localStorage.
 * @returns {Object|null} The parsed admin object, or null when absent/corrupt.
 */
const readStoredAdmin = () => {
  try {
    const raw = localStorage.getItem(AUTH_ADMIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Provides authentication state (token + admin profile) and the visitor/admin
 * view mode to the component tree. Mirrors the Theme/Sidebar context pattern:
 * lazy-initialises from localStorage and persists changes there.
 *
 * `viewMode` gates the Projects gateway prompt:
 *   - "admin"   → authenticated; gateway is skipped.
 *   - "visitor" → chose read-only; gateway is skipped.
 *   - null      → undecided; the gateway shows on the Projects page.
 *
 * @param {React.ReactNode} children - Child components.
 */
const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(readStoredToken);
  const [admin, setAdmin] = useState(() => (readStoredToken() ? readStoredAdmin() : null));
  // A returning admin (valid token) skips the gateway; everyone else starts undecided.
  const [viewMode, setViewMode] = useState(() => (readStoredToken() ? "admin" : null));

  const isAdmin = Boolean(token && admin?.role === "admin");

  /**
   * Clear all auth state + persisted session. Falls back to "visitor" so the
   * gateway doesn't immediately re-prompt; the TopBar "Sign in" button remains
   * the way back to admin.
   */
  const logout = useCallback(() => {
    console.log("[AuthContext] logout → clearing session");
    setToken(null);
    setAdmin(null);
    setViewMode("visitor");
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_ADMIN_KEY);
  }, []);

  /**
   * Authenticate with the API, then persist + store the token and admin profile.
   * @param {string} username - Admin username.
   * @param {string} password - Admin password.
   * @returns {Promise<void>} Resolves on success; rejects (throws) on failure so
   *   the LoginModal can surface the error and keep itself open.
   */
  const login = useCallback(async (username, password) => {
    console.log(`[AuthContext] login → requesting token for "${username}"`);
    const { token: nextToken, admin: nextAdmin } = await loginRequest(username, password);
    // Persist first so the api request interceptor can read the token immediately.
    localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    localStorage.setItem(AUTH_ADMIN_KEY, JSON.stringify(nextAdmin));
    setToken(nextToken);
    setAdmin(nextAdmin);
    setViewMode("admin");
    console.log(`[AuthContext] login success → admin "${nextAdmin?.username}", viewMode=admin`);
  }, []);

  // On mount with a stored token, re-confirm it against the server and refresh
  // the profile. A 401 there triggers the response interceptor's auto-logout.
  useEffect(() => {
    if (!token) return;
    let ignore = false;
    console.log("[AuthContext] rehydrate → validating stored token via /me");
    (async () => {
      try {
        const fresh = await fetchMe();
        if (ignore) return;
        setAdmin(fresh);
        localStorage.setItem(AUTH_ADMIN_KEY, JSON.stringify(fresh));
        console.log(`[AuthContext] rehydrate ok → admin "${fresh?.username}"`);
      } catch {
        // Interceptor already cleared storage + dispatched auth:unauthorized.
        console.warn("[AuthContext] rehydrate failed → token invalid/expired");
      }
    })();
    return () => {
      ignore = true;
    };
    // Intentionally run once on mount — re-validating on every token change is
    // unnecessary since login() already sets a fresh profile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for the api layer's 401 broadcast and log out in response.
  useEffect(() => {
    const onUnauthorized = () => {
      console.warn("[AuthContext] received auth:unauthorized → logging out");
      logout();
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ token, admin, isAdmin, viewMode, login, logout, setViewMode }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
