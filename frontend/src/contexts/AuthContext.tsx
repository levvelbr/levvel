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
import api from "../services/api";
import type { EstablishmentPersonType, UserSession } from "../types/auth";

interface AuthContextValue {
  session: UserSession | null;
  isAuthenticated: boolean;
  login: (nextSession: UserSession) => void;
  updateSession: (nextSession: Partial<UserSession>) => void;
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

  useEffect(() => {
    if (session?.role !== "estabelecimento" || !session.id) {
      return;
    }

    let isCurrent = true;

    api
      .get("/v1/estabelecimentos/me")
      .then((response) => {
        const profile = response.data as {
          tipo_pessoa?: EstablishmentPersonType;
        };

        if (
          !isCurrent ||
          (profile.tipo_pessoa !== "autonomo" &&
            profile.tipo_pessoa !== "juridica")
        ) {
          return;
        }

        setSession((currentSession) => {
          if (
            !currentSession ||
            currentSession.tipo_pessoa === profile.tipo_pessoa
          ) {
            return currentSession;
          }

          const mergedSession: UserSession = {
            ...currentSession,
            tipo_pessoa: profile.tipo_pessoa,
          };
          setStoredSession(mergedSession);
          return mergedSession;
        });
      })
      .catch(() => {
        // The existing session remains usable if profile hydration fails.
      });

    return () => {
      isCurrent = false;
    };
  }, [session?.id, session?.role, session?.tipo_pessoa]);

  const value = useMemo<AuthContextValue>(() => {
    const login = (nextSession: UserSession) => {
      setStoredSession(nextSession);
      setSession(nextSession);
    };

    const updateSession = (nextSession: Partial<UserSession>) => {
      setSession((currentSession) => {
        if (!currentSession) {
          return currentSession;
        }

        const hasAnyChange = Object.entries(nextSession).some(
          ([key, value]) => currentSession[key as keyof UserSession] !== value,
        );

        if (!hasAnyChange) {
          return currentSession;
        }

        const mergedSession = {
          ...currentSession,
          ...nextSession,
        };

        setStoredSession(mergedSession);
        return mergedSession;
      });
    };

    const logout = () => {
      clearStoredSession();
      setSession(null);
    };

    return {
      session,
      isAuthenticated: Boolean(session?.access_token),
      login,
      updateSession,
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
