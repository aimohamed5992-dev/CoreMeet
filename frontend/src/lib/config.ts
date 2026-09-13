/** Central place for build-time configuration. */
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5099",
  /** SignalR hub URL (used from step 3 onward). */
  hubUrl: import.meta.env.VITE_HUB_URL ?? "http://localhost:5099/hubs/meeting",
  /** ICE servers for WebRTC. Override via VITE_ICE_SERVERS (JSON array of RTCIceServer). */
  iceServers: parseIceServers(import.meta.env.VITE_ICE_SERVERS),
} as const;

function parseIceServers(raw: string | undefined): RTCIceServer[] {
  const fallback: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as RTCIceServer[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    console.warn("Invalid VITE_ICE_SERVERS, falling back to default STUN");
    return fallback;
  }
}
