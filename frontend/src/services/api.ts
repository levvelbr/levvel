import axios from "axios";
import { clearStoredSession, getStoredSession } from "./authStorage";

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const session = getStoredSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearStoredSession();
    }

    return Promise.reject(error);
  },
);

export default api;
