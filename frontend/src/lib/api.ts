import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { config } from "./config";
import { getSession, setSession } from "./auth/tokenStore";

/** Shared axios instance for the Cloud Meet API. */
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
  } catch (e) {
    // Only a genuine "this refresh token is invalid" response should sign the
    // user out. A dropped connection, a timeout, or the API being briefly
    // unreachable must not — the refresh token itself is still fine, and the
    // next request gets another chance to refresh.
    if (axios.isAxiosError(e) && e.response?.status === 401) setSession(null);
    return null;
  }
}

// Endpoints that must NOT trigger a refresh-and-retry: login/register can
// legitimately 401 for bad credentials, and refresh itself must never retry
// through this same logic (infinite loop). Everything else under /api/auth/
// (me, logout, …) is a normal authenticated call and belongs in the retry
// path below — excluding the whole "/api/auth/" prefix here used to also
// catch GET /api/auth/me, so an access token merely expiring (every 30 min)
// signed the user out on the next page load instead of silently refreshing.
const NO_REFRESH_RETRY = ["/api/auth/login", "/api/auth/register", "/api/auth/refresh"];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
    const isAuthCall = !!original?.url && NO_REFRESH_RETRY.some((p) => original.url!.includes(p));

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
