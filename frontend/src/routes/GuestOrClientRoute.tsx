import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface GuestOrClientRouteProps {
  redirectTo?: string;
}

// Blocks logged-in "estabelecimento" sessions from client/guest-only pages.
export const GuestOrClientRoute = ({
  redirectTo = "/",
}: GuestOrClientRouteProps) => {
  const { session } = useAuth();

  if (session?.role === "estabelecimento") {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
