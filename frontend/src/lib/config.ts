/** Central place for build-time configuration. */
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5099",
  /** SignalR hub URL (used from step 3 onward). */
  hubUrl: import.meta.env.VITE_HUB_URL ?? "http://localhost:5099/hubs/meeting",
  /** ICE servers for WebRTC (used from step 4 onward). */
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
} as const;
