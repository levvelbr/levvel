import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoggingOut } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
        state={
          isLoggingOut
            ? null
            : {
                from: `${location.pathname}${location.search}`,
                openLogin: true,
              }
        }
      />
    );
  }

  return <Outlet />;
};
