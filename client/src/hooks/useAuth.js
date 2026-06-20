import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * Returns the auth state and actions from AuthContext.
 *
 * @returns {{
 *   token: string|null,
 *   admin: Object|null,
 *   isAdmin: boolean,
 *   viewMode: "admin"|"visitor"|null,
 *   login: (username: string, password: string) => Promise<void>,
 *   logout: () => void,
 *   setViewMode: (mode: "admin"|"visitor"|null) => void,
 * }} Auth state and actions.
 */
export const useAuth = () => {
  return useContext(AuthContext);
};
