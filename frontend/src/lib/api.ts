import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { config } from "./config";
import { getSession, setSession } from "./auth/tokenStore";

/** Shared axios instance for the CoreMeet API. */
export const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

/** Bare client for the refresh call so it never recurses through the interceptor. */
const bare = axios.create({ baseURL: config.apiBaseUrl });

api.interceptors.request.use((cfg) => {
  const token = getSession()?.accessToken;
  if (token && cfg.headers) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const current = getSession();
  if (!current?.refreshToken) return null;
  try {
    const { data } = await bare.post("/api/auth/refresh", {
      refreshToken: current.refreshToken,
    });
    setSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    });
    return data.accessToken as string;
  } catch {
    setSession(null);
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
    const isAuthCall = original?.url?.includes("/api/auth/");

    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

export type ApiError = { message: string; errors?: Record<string, string[]> };

/** Known backend (English) messages → i18n keys, so the UI can localise them. */
const KNOWN_MESSAGES: Record<string, string> = {
  "Invalid email or password.": "errors.invalidCredentials",
  "An account with this email already exists.": "errors.emailExists",
  "Meeting not found.": "errors.meetingNotFound",
  "This meeting is not available.": "errors.meetingUnavailable",
};

/**
 * Pull a human-readable message out of an axios error.
 * Pass i18next's `t` to localise known server messages and the fallback key.
 */
export function errorMessage(
  err: unknown,
  fallback = "Something went wrong.",
  t?: (key: string) => string,
): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiError | undefined;
    if (data?.errors) {
      const first = Object.values(data.errors)[0];
      if (first?.length) return first[0];
    }
    if (data?.message) {
      const key = KNOWN_MESSAGES[data.message];
      return key && t ? t(key) : data.message;
    }
  }
  if (t && fallback.includes(".")) return t(fallback);
  return fallback;
}
