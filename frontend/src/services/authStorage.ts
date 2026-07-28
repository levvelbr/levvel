import type { UserSession } from "../types/auth";

const AUTH_SESSION_KEY = "authSession";
export const AUTH_SESSION_CHANGED_EVENT = "auth-session-changed";

const notifySessionChanged = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
};

export const getStoredSession = (): UserSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<UserSession>;

    if (
      !parsed ||
      typeof parsed.access_token !== "string" ||
      typeof parsed.role !== "string" ||
      typeof parsed.id !== "string" ||
      typeof parsed.nome !== "string"
    ) {
      return null;
    }

    return {
      id: parsed.id,
      role: parsed.role as UserSession["role"],
      nome: parsed.nome,
      email_ou_cpf:
        typeof parsed.email_ou_cpf === "string" ? parsed.email_ou_cpf : "",
      access_token: parsed.access_token,
      token_type:
        typeof parsed.token_type === "string" ? parsed.token_type : "bearer",
    };
  } catch {
    return null;
  }
};

export const setStoredSession = (session: UserSession) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  notifySessionChanged();
};

export const clearStoredSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_KEY);
  notifySessionChanged();
};
