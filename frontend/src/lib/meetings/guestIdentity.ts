/** Remembers a guest's chosen name + avatar between visits (no account). */
const KEY = "coremeet.guest";

export type GuestIdentity = {
  name: string;
  avatarUrl: string | null;
};

export function getGuestIdentity(): GuestIdentity {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<GuestIdentity>;
      return { name: p.name ?? "", avatarUrl: p.avatarUrl ?? null };
    }
  } catch {
    /* ignore */
  }
  return { name: "", avatarUrl: null };
}

export function saveGuestIdentity(id: GuestIdentity) {
  try {
    localStorage.setItem(KEY, JSON.stringify(id));
  } catch {
    /* ignore */
  }
}
