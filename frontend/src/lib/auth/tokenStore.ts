import type { AuthSession } from "./types";

/**
 * Module-level holder for the current auth session. Shared between the axios
 * layer (which reads the access token and triggers refresh) and AuthContext
 * (which owns React state). Persisted to localStorage so a reload stays signed in.
 *
 * Note: storing the refresh token in localStorage is a pragmatic SPA choice and
 * is vulnerable to XSS. A hardened setup would move it to an httpOnly cookie.
 */
const KEY = "coremeet.auth";

let session: AuthSession | null = load();
const listeners = new Set<(s: AuthSession | null) => void>();

function load(): AuthSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function getSession() {
  return session;
}

export function setSession(next: AuthSession | null) {
  session = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable — keep in-memory only */
  }
  listeners.forEach((fn) => fn(next));
}

export function subscribe(fn: (s: AuthSession | null) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
