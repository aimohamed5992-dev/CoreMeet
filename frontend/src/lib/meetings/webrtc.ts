import { config } from "../config";
import type { MeetingHub, PeerJoined, PeerLeft, RoomPeer } from "./meetingHub";

type RemoteHandler = (connectionId: string, stream: MediaStream | null, meta?: { participantId?: string }) => void;

type PeerEntry = {
  pc: RTCPeerConnection;
  participantId?: string;
  pendingIce: RTCIceCandidateInit[];
  remoteDescSet: boolean;
};

/**
 * Full-mesh WebRTC: every participant holds one RTCPeerConnection to every other.
 * The participant who *joins* sends the offers (they learn the room via `roomPeers`);
 * everyone already in the room answers. Screen sharing swaps the outgoing video
 * track via `replaceTrack`, so no renegotiation is needed.
 */
export class PeerMesh {
  private peers = new Map<string, PeerEntry>();
  private localStream: MediaStream | null = null;
  private unsubs: Array<() => void> = [];
  private disposed = false;
  private hub: MeetingHub;
  private onRemote: RemoteHandler;

  constructor(hub: MeetingHub, onRemote: RemoteHandler) {
    this.hub = hub;
    this.onRemote = onRemote;
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
    entry = { pc, participantId, pendingIce: [], remoteDescSet: false };
    this.peers.set(connectionId, entry);

    this.syncTracks(pc);

    pc.onicecandidate = (e) => {
      if (e.candidate) this.hub.sendIceCandidate(connectionId, JSON.stringify(e.candidate));
    };
    pc.ontrack = (e) => {
      const stream = e.streams[0] ?? new MediaStream([e.track]);
      this.onRemote(connectionId, stream, { participantId: entry!.participantId });
    };
    pc.onconnectionstatechange = () => {
      if (["failed", "closed"].includes(pc.connectionState)) this.dropPeer(connectionId);
    };

    return entry;
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
    try {
      await entry.pc.setRemoteDescription(JSON.parse(sdp));
      entry.remoteDescSet = true;
      await this.flushIce(from);
      const answer = await entry.pc.createAnswer();
      await entry.pc.setLocalDescription(answer);
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
    await entry.pc.addIceCandidate(parsed).catch(() => undefined);
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
    entry.pc.onicecandidate = null;
    entry.pc.ontrack = null;
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
