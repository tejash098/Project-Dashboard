/**
 * Barrel for the API service layer. Re-exports the shared axios client (and its
 * auth-storage keys) plus every resource module, so existing imports like
 * `import { fetchProjects } from "../services/api"` keep resolving here (Vite
 * resolves the `services/api` directory to this index.js). The `Project` and
 * `Admin` typedefs re-exported below back the `import("../services/api").Project`
 * JSDoc references used across the app.
 */
export { default, AUTH_TOKEN_KEY, AUTH_ADMIN_KEY } from "./client";
export * from "./project";
export * from "./auth";
export * from "./feedback";
export * from "./techstack";
