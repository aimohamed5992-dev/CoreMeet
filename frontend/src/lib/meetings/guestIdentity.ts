/** Remembers a guest's chosen name + avatar between visits (no account). */
const KEY = "coremeet.guest";

export type GuestIdentity = {
  name: string;
  avatarUrl: string | null;
  /** Stable per-browser id so a guest who leaves and rejoins reuses one roster row. */
  key: string;
};

function newGuestKey(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

export function getGuestIdentity(): GuestIdentity {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<GuestIdentity>;
      return { name: p.name ?? "", avatarUrl: p.avatarUrl ?? null, key: p.key || newGuestKey() };
    }
  } catch {
    /* ignore */
  }
  return { name: "", avatarUrl: null, key: newGuestKey() };
}

export function saveGuestIdentity(id: GuestIdentity) {
  try {
    localStorage.setItem(KEY, JSON.stringify(id));
  } catch {
    /* ignore */
  }
}
