import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Route guard that restricts its children to authenticated admins. `isAdmin` is
 * derived synchronously from the persisted token + admin profile in AuthContext,
 * so a page refresh on a protected route won't wrongly bounce a valid admin while
 * the background `/auth/me` revalidation runs. Non-admins are redirected home.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The protected element to render for admins.
 */
const ProtectedRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;
