import { api } from "../api";
import type { JoinMeetingResponse, MeetingDetail, MeetingSummary } from "./types";

export const meetingsApi = {
  async create(title?: string) {
    const { data } = await api.post<MeetingSummary>("/api/meetings", { title });
    return data;
  },

  async getByCode(code: string) {
    const { data } = await api.get<MeetingDetail>(`/api/meetings/${encodeURIComponent(code)}`);
    return data;
  },

  async join(code: string, guest?: { displayName?: string; avatarUrl?: string | null; key?: string }) {
    const { data } = await api.post<JoinMeetingResponse>(
      `/api/meetings/${encodeURIComponent(code)}/join`,
      {
        displayName: guest?.displayName,
        avatarUrl: guest?.avatarUrl ?? undefined,
        guestKey: guest?.key,
      },
    );
    return data;
  },

  async listMine() {
    const { data } = await api.get<MeetingSummary[]>("/api/meetings/mine");
    return data;
  },

  async rename(code: string, title: string) {
    const { data } = await api.put<{ title: string }>(
      `/api/meetings/${encodeURIComponent(code)}`,
      { title },
    );
    return data.title;
  },

  async end(code: string) {
    await api.post(`/api/meetings/${encodeURIComponent(code)}/end`);
  },
};

/** Normalise whatever the user pastes (raw code, or a full /meeting/<code> link) to a code. */
export function parseMeetingCode(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const fromUrl = trimmed.match(/(?:meeting|join)\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
  if (fromUrl) return fromUrl[1].toLowerCase();
  const bare = trimmed.match(/^[a-z]{3}-?[a-z]{4}-?[a-z]{3}$/i);
  if (bare) {
    const letters = trimmed.replace(/-/g, "").toLowerCase();
    return `${letters.slice(0, 3)}-${letters.slice(3, 7)}-${letters.slice(7, 10)}`;
  }
  return trimmed.toLowerCase();
}
