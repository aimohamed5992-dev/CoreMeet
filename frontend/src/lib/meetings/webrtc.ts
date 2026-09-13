import { config } from "../config";
import type { MeetingHub, PeerJoined, PeerLeft, RoomPeer } from "./meetingHub";

type RemoteHandler = (connectionId: string, stream: MediaStream | null, meta?: { participantId?: string }) => void;
/** Fires whenever a peer's connection health changes, so the UI can show "reconnecting…" instead of silent dead air. */
type ConnStateHandler = (connectionId: string, state: RTCPeerConnectionState) => void;

type PeerEntry = {
  pc: RTCPeerConnection;
  participantId?: string;
  pendingIce: RTCIceCandidateInit[];
  remoteDescSet: boolean;
  /** Perfect-negotiation glare handling (see handleOffer/onnegotiationneeded). */
  makingOffer: boolean;
  ignoreOffer: boolean;
  /** Exactly one side of each pair is polite, decided locally by comparing ids — no extra signaling needed. */
  polite: boolean;
  /** disconnected/failed self-heal: debounce + bounded retries before giving up. */
  disconnectTimer: ReturnType<typeof setTimeout> | null;
  restartAttempts: number;
};

// A transient "disconnected" (NAT rebind, brief wifi blip) often clears itself —
// wait this long before forcing an ICE restart. "failed" restarts immediately.
const DISCONNECT_GRACE_MS = 4000;
const MAX_RESTART_ATTEMPTS = 3;

/**
 * Full-mesh WebRTC: every participant holds one RTCPeerConnection to every other.
 * The participant who *joins* sends the offers (they learn the room via `roomPeers`);
 * everyone already in the room answers. Screen sharing swaps the outgoing video
 * track via `replaceTrack`, so no renegotiation is needed for that.
 *
 * Connections do sometimes still drop underneath us (NAT rebind, wifi blip, a
 * codec/bandwidth hiccup around a track swap) — previously the only handling was
 * "failed/closed -> drop the tile", so a peer stuck in "disconnected" just sat
 * there with dead audio until someone left and rejoined. Now every connection is
 * watched and self-heals via ICE restart (see onconnectionstatechange / restartPeer),
 * using the standard "perfect negotiation" pattern so a restart from either side
 * can't glare into a broken renegotiation.
 */
export class PeerMesh {
  private peers = new Map<string, PeerEntry>();
  private localStream: MediaStream | null = null;
  private unsubs: Array<() => void> = [];
  private disposed = false;
  private hub: MeetingHub;
  private onRemote: RemoteHandler;
  private onConnState?: ConnStateHandler;

  constructor(hub: MeetingHub, onRemote: RemoteHandler, onConnState?: ConnStateHandler) {
    this.hub = hub;
    this.onRemote = onRemote;
    this.onConnState = onConnState;
    this.unsubs.push(
      hub.on("roomPeers", (peers: RoomPeer[]) => {
        // I'm the newcomer — call everyone already here.
        peers.forEach((p) => this.callPeer(p.connectionId, p.participantId));
      }),
      hub.on("peerJoined", (p: PeerJoined) => {
        // Someone joined after me — prepare the connection; they will send the offer.
        this.ensurePeer(p.connectionId, p.participantId);
      }),
      hub.on("peerLeft", (p: PeerLeft) => this.dropPeer(p.connectionId)),
      hub.on("offer", (from: string, sdp: string) => this.handleOffer(from, sdp)),
      hub.on("answer", (from: string, sdp: string) => this.handleAnswer(from, sdp)),
      hub.on("iceCandidate", (from: string, candidate: string) => this.handleIce(from, candidate)),
    );
  }

  setLocalStream(stream: MediaStream | null) {
    this.localStream = stream;
    for (const { pc } of this.peers.values()) this.syncTracks(pc);
  }

  /** Replace the outgoing track of a given kind on every peer connection. */
  replaceOutgoingTrack(kind: "video" | "audio", track: MediaStreamTrack | null) {
    for (const { pc } of this.peers.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === kind || (!s.track && kindOfTransceiver(pc, s) === kind));
      if (sender) sender.replaceTrack(track).catch(() => undefined);
      else if (track && this.localStream) pc.addTrack(track, this.localStream);
    }
  }

  dispose() {
    this.disposed = true;
    this.unsubs.forEach((u) => u());
    for (const id of [...this.peers.keys()]) this.dropPeer(id);
  }

  // ---- connection lifecycle ----------------------------------------

  private ensurePeer(connectionId: string, participantId?: string): PeerEntry {
    let entry = this.peers.get(connectionId);
    if (entry) {
      if (participantId) entry.participantId = participantId;
      return entry;
    }

    const pc = new RTCPeerConnection({ iceServers: [...config.iceServers] as RTCIceServer[] });
    entry = {
      pc,
      participantId,
      pendingIce: [],
      remoteDescSet: false,
      makingOffer: false,
      ignoreOffer: false,
      // Compare connectionIds so both sides land on complementary roles with no
      // extra messages: whichever side is "smaller" always defers on glare.
      polite: (this.hub.connectionId ?? "") < connectionId,
      disconnectTimer: null,
      restartAttempts: 0,
    };
    this.peers.set(connectionId, entry);

    this.syncTracks(pc);

    pc.onicecandidate = (e) => {
      if (e.candidate) this.hub.sendIceCandidate(connectionId, JSON.stringify(e.candidate));
    };
    pc.ontrack = (e) => {
      const stream = e.streams[0] ?? new MediaStream([e.track]);
      this.onRemote(connectionId, stream, { participantId: entry!.participantId });
    };
    // Renegotiation (e.g. after restartIce()) — either side can trigger this at
    // any time, so it has to cooperate with handleOffer's glare handling below.
    pc.onnegotiationneeded = async () => {
      try {
        entry!.makingOffer = true;
        await pc.setLocalDescription();
        this.hub.sendOffer(connectionId, JSON.stringify(pc.localDescription));
      } catch {
        /* ignore — connection may have moved on already */
      } finally {
        entry!.makingOffer = false;
      }
    };
    pc.onconnectionstatechange = () => {
      this.onConnState?.(connectionId, pc.connectionState);
      if (pc.connectionState === "connected") {
        entry!.restartAttempts = 0;
        this.clearDisconnectTimer(entry!);
        return;
      }
      if (pc.connectionState === "disconnected") {
        // Often a transient NAT rebind / brief network blip that clears itself —
        // give it a few seconds before forcing a restart.
        if (!entry!.disconnectTimer) {
          entry!.disconnectTimer = setTimeout(() => {
            entry!.disconnectTimer = null;
            if (pc.connectionState === "disconnected") this.restartPeer(connectionId);
          }, DISCONNECT_GRACE_MS);
        }
        return;
      }
      if (pc.connectionState === "failed") {
        this.clearDisconnectTimer(entry!);
        this.restartPeer(connectionId);
        return;
      }
      if (pc.connectionState === "closed") this.dropPeer(connectionId);
    };

    return entry;
  }

  /** Self-heal a stuck connection via ICE restart; give up (and drop the tile) after a few tries. */
  private restartPeer(connectionId: string) {
    const entry = this.peers.get(connectionId);
    if (!entry) return;
    entry.restartAttempts += 1;
    if (entry.restartAttempts > MAX_RESTART_ATTEMPTS) {
      this.dropPeer(connectionId);
      return;
    }
    try {
      // Triggers onnegotiationneeded, which sends a fresh offer with new ICE
      // credentials — same recovery path a manual "leave and rejoin" used to
      // force by rebuilding the connection from scratch, but without dropping
      // media or the roster entry.
      entry.pc.restartIce();
    } catch {
      /* very old browsers without restartIce(): nothing more we can do here */
    }
  }

  private clearDisconnectTimer(entry: PeerEntry) {
    if (entry.disconnectTimer) {
      clearTimeout(entry.disconnectTimer);
      entry.disconnectTimer = null;
    }
  }

  private async callPeer(connectionId: string, participantId?: string) {
    if (connectionId === this.hub.connectionId) return;
    const { pc } = this.ensurePeer(connectionId, participantId);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.hub.sendOffer(connectionId, JSON.stringify(pc.localDescription));
    } catch {
      /* ignore — connection may have been torn down */
    }
  }

  private async handleOffer(from: string, sdp: string) {
    if (this.disposed) return;
    const entry = this.ensurePeer(from);
    const description = JSON.parse(sdp) as RTCSessionDescriptionInit;
    // Perfect negotiation: if we're also mid-offer (or not stable) when an
    // offer arrives, that's glare. The impolite side ignores the incoming
    // offer (its own will win); the polite side rolls back and accepts it.
    const offerCollision = description.type === "offer" &&
      (entry.makingOffer || entry.pc.signalingState !== "stable");
    entry.ignoreOffer = !entry.polite && offerCollision;
    if (entry.ignoreOffer) return;

    try {
      if (offerCollision) {
        await Promise.all([
          entry.pc.setLocalDescription({ type: "rollback" }),
          entry.pc.setRemoteDescription(description),
        ]);
      } else {
        await entry.pc.setRemoteDescription(description);
      }
      entry.remoteDescSet = true;
      await this.flushIce(from);
      await entry.pc.setLocalDescription();
      this.hub.sendAnswer(from, JSON.stringify(entry.pc.localDescription));
    } catch {
      /* ignore */
    }
  }

  private async handleAnswer(from: string, sdp: string) {
    const entry = this.peers.get(from);
    if (!entry) return;
    try {
      await entry.pc.setRemoteDescription(JSON.parse(sdp));
      entry.remoteDescSet = true;
      await this.flushIce(from);
    } catch {
      /* ignore */
    }
  }

  private async handleIce(from: string, candidate: string) {
    const entry = this.peers.get(from);
    if (!entry) return;
    const parsed: RTCIceCandidateInit = JSON.parse(candidate);
    if (!entry.remoteDescSet) {
      entry.pendingIce.push(parsed);
      return;
    }
    try {
      await entry.pc.addIceCandidate(parsed);
    } catch (e) {
      // A candidate for an offer we just rolled back (perfect-negotiation glare)
      // fails harmlessly — anything else we still just swallow, as before.
      if (!entry.ignoreOffer) void e;
    }
  }

  private async flushIce(from: string) {
    const entry = this.peers.get(from);
    if (!entry) return;
    const queued = entry.pendingIce.splice(0);
    for (const c of queued) await entry.pc.addIceCandidate(c).catch(() => undefined);
  }

  private dropPeer(connectionId: string) {
    const entry = this.peers.get(connectionId);
    if (!entry) return;
    this.clearDisconnectTimer(entry);
    entry.pc.onicecandidate = null;
    entry.pc.ontrack = null;
    entry.pc.onnegotiationneeded = null;
    entry.pc.onconnectionstatechange = null;
    entry.pc.close();
    this.peers.delete(connectionId);
    this.onRemote(connectionId, null);
  }

  private syncTracks(pc: RTCPeerConnection) {
    if (!this.localStream) return;
    const existing = new Set(pc.getSenders().map((s) => s.track?.id).filter(Boolean));
    for (const track of this.localStream.getTracks()) {
      if (!existing.has(track.id)) pc.addTrack(track, this.localStream);
    }
  }
}

function kindOfTransceiver(pc: RTCPeerConnection, sender: RTCRtpSender): string | undefined {
  return pc.getTransceivers().find((t) => t.sender === sender)?.receiver.track?.kind;
}
