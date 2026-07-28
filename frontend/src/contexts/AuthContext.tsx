import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from "../services/authStorage";
import type { UserSession } from "../types/auth";

interface AuthContextValue {
  session: UserSession | null;
  isAuthenticated: boolean;
  login: (nextSession: UserSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<UserSession | null>(() =>
    getStoredSession(),
  );

  useEffect(() => {
    const syncSession = () => {
      setSession(getStoredSession());
    };

    window.addEventListener("storage", syncSession);
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const login = (nextSession: UserSession) => {
      setStoredSession(nextSession);
      setSession(nextSession);
    };

    const logout = () => {
      clearStoredSession();
      setSession(null);
    };

    return {
      session,
      isAuthenticated: Boolean(session?.access_token),
      login,
      logout,
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
