import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { authApi } from "./authApi";
import { getSession, setSession, subscribe } from "./tokenStore";
import type { User } from "./types";

type AuthState = {
  user: User | null;
  status: "loading" | "authenticated" | "anonymous";
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: { name: string; avatarUrl: string | null }) => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getSession()?.user ?? null);
  const [status, setStatus] = useState<AuthState["status"]>(() =>
    getSession() ? "loading" : "anonymous",
  );

  // Keep local state in sync if the token store changes elsewhere (e.g. a
  // background refresh, or sign-out triggered by the axios layer).
  useEffect(
    () =>
      subscribe((s) => {
        setUser(s?.user ?? null);
        setStatus(s ? "authenticated" : "anonymous");
      }),
    [],
  );

  // On first load, validate an existing session against the API.
  useEffect(() => {
    if (!getSession()) return;
    let cancelled = false;
    authApi
      .me()
      .then((fresh) => {
        if (cancelled) return;
        const s = getSession();
        if (s) setSession({ ...s, user: fresh });
        setStatus("authenticated");
      })
      .catch(() => {
        if (!cancelled) {
          setSession(null);
          setStatus("anonymous");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback<AuthState["register"]>(async (input) => {
    const res = await authApi.register(input);
    setSession({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user });
    setStatus("authenticated");
  }, []);

  const login = useCallback<AuthState["login"]>(async (input) => {
    const res = await authApi.login(input);
    setSession({ accessToken: res.accessToken, refreshToken: res.refreshToken, user: res.user });
    setStatus("authenticated");
  }, []);

  const logout = useCallback<AuthState["logout"]>(async () => {
    const s = getSession();
    if (s?.refreshToken) await authApi.logout(s.refreshToken).catch(() => undefined);
    setSession(null);
    setStatus("anonymous");
  }, []);

  const updateProfile = useCallback<AuthState["updateProfile"]>(async (input) => {
    const fresh = await authApi.updateProfile(input);
    const s = getSession();
    if (s) setSession({ ...s, user: fresh });
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, status, register, login, logout, updateProfile }),
    [user, status, register, login, logout, updateProfile],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
