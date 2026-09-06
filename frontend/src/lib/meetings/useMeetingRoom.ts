import { useCallback, useEffect, useRef, useState } from "react";
import { MeetingHub, type PeerJoined, type PeerLeft, type RoomPeer } from "./meetingHub";
import { PeerMesh } from "./webrtc";
import { meetingsApi } from "./meetingsApi";
import type { ChatMessage, MeetingDetail, Participant } from "./types";

type ConnState = "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

export type RemoteFeed = { connectionId: string; participantId?: string; stream: MediaStream };
export type RemoteMediaState = { audio: boolean; video: boolean; screen: boolean };

export type MeetingRoom = {
  meeting: MeetingDetail | null;
  me: Participant | null;
  participants: Participant[];
  messages: ChatMessage[];
  remoteFeeds: RemoteFeed[];
  remoteMedia: Record<string, RemoteMediaState>;
  connState: ConnState;
  error: string | null;
  sendMessage: (content: string) => void;
  replaceOutgoingVideo: (track: MediaStreamTrack | null) => void;
  replaceOutgoingAudio: (track: MediaStreamTrack | null) => void;
  broadcastMediaState: (audio: boolean, video: boolean, screen: boolean) => void;
};

type Options = {
  localStream: MediaStream | null;
  /** Wait for the media layer to settle (granted or denied) before joining. */
  mediaSettled: boolean;
  /** Guest name + avatar when the viewer is not signed in. */
  guest?: { displayName: string; avatarUrl: string | null };
};

/**
 * Joins over REST, opens the SignalR hub, keeps the roster + chat live, and runs
 * the WebRTC peer mesh so remote camera/mic streams arrive as `remoteFeeds`.
 */
export function useMeetingRoom(code: string, { localStream, mediaSettled, guest }: Options): MeetingRoom {
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [me, setMe] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [remoteFeeds, setRemoteFeeds] = useState<RemoteFeed[]>([]);
  const [remoteMedia, setRemoteMedia] = useState<Record<string, RemoteMediaState>>({});
  const [connState, setConnState] = useState<ConnState>("connecting");
  const [error, setError] = useState<string | null>(null);

  const hubRef = useRef<MeetingHub | null>(null);
  const meshRef = useRef<PeerMesh | null>(null);
  const streamRef = useRef<MediaStream | null>(localStream);
  streamRef.current = localStream;
  const myMediaRef = useRef<RemoteMediaState>({ audio: true, video: true, screen: false });
  const guestRef = useRef(guest);
  guestRef.current = guest;

  // Push the freshest local stream into the mesh whenever it changes.
  useEffect(() => {
    meshRef.current?.setLocalStream(localStream);
  }, [localStream]);

  useEffect(() => {
    if (!mediaSettled) return;
    let disposed = false;
    const hub = new MeetingHub();
    hubRef.current = hub;

    const upsertParticipant = (p: Partial<Participant> & { id: string }) =>
      setParticipants((prev) => {
        const idx = prev.findIndex((x) => x.id === p.id);
        if (idx === -1) return [...prev, p as Participant];
        const next = [...prev];
        next[idx] = { ...next[idx], ...p };
        return next;
      });

    const announce = () => {
      const s = myMediaRef.current;
      hub.setMediaState(s.audio, s.video, s.screen);
    };

    (async () => {
      try {
        const joined = await meetingsApi.join(code, guestRef.current);
        if (disposed) return;
        setMeeting(joined.meeting);
        setMe(joined.me);
        setParticipants(joined.meeting.participants);

        hub.on("roomPeers", (peers: RoomPeer[]) =>
          peers.forEach((peer) =>
            upsertParticipant({
              id: peer.participantId,
              displayName: peer.displayName,
              avatarColor: peer.avatarColor,
              avatarUrl: peer.avatarUrl ?? null,
              isConnected: true,
            }),
          ),
        );
        hub.on("peerJoined", (peer: PeerJoined) => {
          upsertParticipant({
            id: peer.participantId,
            displayName: peer.displayName,
            avatarColor: peer.avatarColor,
            avatarUrl: peer.avatarUrl ?? null,
            isConnected: true,
          });
          announce(); // so the newcomer's tiles reflect our mic/camera/screen
        });
        hub.on("peerLeft", (peer: PeerLeft) => {
          upsertParticipant({ id: peer.participantId, isConnected: false });
          setRemoteMedia((prev) => {
            const next = { ...prev };
            delete next[peer.connectionId];
            return next;
          });
        });
        hub.on(
          "peerMediaState",
          (s: { connectionId: string; audio: boolean; video: boolean; screen: boolean }) =>
            setRemoteMedia((prev) => ({
              ...prev,
              [s.connectionId]: { audio: s.audio, video: s.video, screen: !!s.screen },
            })),
        );
        hub.on("chatMessage", (msg: ChatMessage) =>
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])),
        );
        hub.on("error", (message: string) => setError(message));

        hub.onReconnected(async () => {
          setConnState("connected");
          await hub.joinRoom(code, joined.me.id).catch(() => undefined);
          announce();
        });
        hub.onClose(() => !disposed && setConnState("disconnected"));

        // Build the mesh BEFORE joining so we catch the first roomPeers/peerJoined.
        const mesh = new PeerMesh(hub, (connectionId, stream, meta) => {
          setRemoteFeeds((prev) => {
            const rest = prev.filter((f) => f.connectionId !== connectionId);
            return stream ? [...rest, { connectionId, participantId: meta?.participantId, stream }] : rest;
          });
        });
        mesh.setLocalStream(streamRef.current);
        meshRef.current = mesh;

        await hub.start();
        if (disposed) return;
        await hub.joinRoom(code, joined.me.id);
        setConnState("connected");
        upsertParticipant({ id: joined.me.id, isConnected: true });
        announce();
      } catch (e) {
        if (disposed) return;
        setError(
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Could not join this meeting.",
        );
        setConnState("error");
      }
    })();

    return () => {
      disposed = true;
      meshRef.current?.dispose();
      meshRef.current = null;
      hub.leaveRoom().finally(() => hub.stop());
      hubRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, mediaSettled]);

  const sendMessage = useCallback((content: string) => {
    const trimmed = content.trim();
    if (trimmed) hubRef.current?.sendChatMessage(trimmed).catch(() => undefined);
  }, []);

  const replaceOutgoingVideo = useCallback((track: MediaStreamTrack | null) => {
    meshRef.current?.replaceOutgoingTrack("video", track);
  }, []);

  const replaceOutgoingAudio = useCallback((track: MediaStreamTrack | null) => {
    meshRef.current?.replaceOutgoingTrack("audio", track);
  }, []);

  const broadcastMediaState = useCallback((audio: boolean, video: boolean, screen: boolean) => {
    myMediaRef.current = { audio, video, screen };
    hubRef.current?.setMediaState(audio, video, screen);
  }, []);

  return {
    meeting,
    me,
    participants,
    messages,
    remoteFeeds,
    remoteMedia,
    connState,
    error,
    sendMessage,
    replaceOutgoingVideo,
    replaceOutgoingAudio,
    broadcastMediaState,
  };
}
