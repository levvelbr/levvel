import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../types/auth";

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

export const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const { session } = useAuth();

  if (!session || !allowedRoles.includes(session.role)) {
    return <Navigate to="/nao-autorizado" replace />;
  }

  return <Outlet />;
};
