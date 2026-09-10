import { useCallback, useEffect, useRef, useState } from "react";
import { MeetingHub, type PeerJoined, type PeerLeft, type RoomPeer } from "./meetingHub";
import { PeerMesh } from "./webrtc";
import { meetingsApi } from "./meetingsApi";
import type { ChatMessage, MeetingDetail, Participant } from "./types";

type ConnState = "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

export type RemoteFeed = { connectionId: string; participantId?: string; stream: MediaStream };
export type RemoteMediaState = { audio: boolean; video: boolean; screen: boolean };

type Peer = { connectionId: string; name: string };
export type ControlState = {
  /** Incoming request while I'm sharing my screen. */
  incomingRequest: Peer | null;
  respondRequest: (granted: boolean) => void;
  /** Someone is actively controlling my screen. */
  controlledBy: Peer | null;
  /** I am actively controlling someone's screen. */
  controlling: Peer | null;
  requestState: "idle" | "requesting" | "denied";
  deniedReason: string | null;
  request: (targetConnectionId: string) => void;
  sendEvent: (json: string) => void;
  stop: () => void;
  /** Room-wide sessions, keyed by target connection id. */
  sessions: Record<string, { controllerConnectionId: string; controllerName: string }>;
  /** Connection ids running the Cloud Meet desktop app — only these can be controlled. */
  desktopPeers: Set<string>;
  /** Target subscribes here to receive incoming control events. */
  onEvent: (cb: ((json: string) => void) | null) => void;
};

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
  renameMeeting: (title: string) => void;
  control: ControlState;
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

  const [ctlIncoming, setCtlIncoming] = useState<Peer | null>(null);
  const [ctlControlledBy, setCtlControlledBy] = useState<Peer | null>(null);
  const [ctlControlling, setCtlControlling] = useState<Peer | null>(null);
  const [ctlRequestState, setCtlRequestState] = useState<"idle" | "requesting" | "denied">("idle");
  const [ctlDeniedReason, setCtlDeniedReason] = useState<string | null>(null);
  const [ctlSessions, setCtlSessions] = useState<Record<string, { controllerConnectionId: string; controllerName: string }>>({});
  const [desktopPeers, setDesktopPeers] = useState<Set<string>>(() => new Set());
  const ctlPendingRequester = useRef<string | null>(null);
  const ctlEventCb = useRef<((json: string) => void) | null>(null);

  const markDesktop = useCallback((connectionId: string) => {
    setDesktopPeers((prev) => (prev.has(connectionId) ? prev : new Set(prev).add(connectionId)));
  }, []);

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
          peers.forEach((peer) => {
            upsertParticipant({
              id: peer.participantId,
              displayName: peer.displayName,
              avatarColor: peer.avatarColor,
              avatarUrl: peer.avatarUrl ?? null,
              isConnected: true,
            });
            if (peer.desktop) markDesktop(peer.connectionId);
          }),
        );
        hub.on("peerJoined", (peer: PeerJoined) => {
          upsertParticipant({
            id: peer.participantId,
            displayName: peer.displayName,
            avatarColor: peer.avatarColor,
            avatarUrl: peer.avatarUrl ?? null,
            isConnected: true,
          });
          if (peer.desktop) markDesktop(peer.connectionId);
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
        hub.on("meetingRenamed", (payload: { title: string }) =>
          setMeeting((prev) => (prev ? { ...prev, title: payload.title } : prev)),
        );
        hub.on("error", (message: string) => setError(message));

        // ---- remote control ----
        hub.on("controlRequested", (r: { connectionId: string; name: string }) => {
          ctlPendingRequester.current = r.connectionId;
          setCtlIncoming({ connectionId: r.connectionId, name: r.name });
        });
        hub.on("controlDenied", (_target: string, reason: string) => {
          setCtlRequestState("denied");
          setCtlDeniedReason(reason);
          setCtlControlling(null);
        });
        hub.on("controlResponse", (byConnectionId: string, granted: boolean) => {
          if (granted) {
            setCtlRequestState("idle");
            setCtlControlling((prev) => prev ?? { connectionId: byConnectionId, name: "" });
          } else {
            setCtlRequestState("denied");
            setCtlDeniedReason("denied");
            setCtlControlling(null);
          }
        });
        hub.on("controlGranted", (controllerConnectionId: string, name: string) => {
          setCtlControlledBy({ connectionId: controllerConnectionId, name });
          setCtlIncoming(null);
          ctlPendingRequester.current = null;
        });
        hub.on("controlEnded", () => {
          setCtlControlledBy(null);
          setCtlControlling(null);
          setCtlRequestState("idle");
          setCtlIncoming(null);
          ctlPendingRequester.current = null;
        });
        hub.on("controlEvent", (json: string) => ctlEventCb.current?.(json));
        hub.on("controlSessions", (list: { targetConnectionId: string; controllerConnectionId: string; controllerName: string }[]) =>
          setCtlSessions(Object.fromEntries(list.map((s) => [s.targetConnectionId, { controllerConnectionId: s.controllerConnectionId, controllerName: s.controllerName }]))),
        );
        hub.on("controlStarted", (s: { targetConnectionId: string; controllerConnectionId: string; controllerName: string }) =>
          setCtlSessions((prev) => ({ ...prev, [s.targetConnectionId]: { controllerConnectionId: s.controllerConnectionId, controllerName: s.controllerName } })),
        );
        hub.on("controlStopped", (s: { targetConnectionId: string }) =>
          setCtlSessions((prev) => {
            const next = { ...prev };
            delete next[s.targetConnectionId];
            return next;
          }),
        );

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

  const renameMeeting = useCallback((title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setMeeting((prev) => (prev ? { ...prev, title: trimmed } : prev)); // optimistic
    hubRef.current?.renameMeeting(trimmed);
  }, []);

  // ---- control actions ----
  const ctlRequest = useCallback((targetConnectionId: string) => {
    setCtlRequestState("requesting");
    setCtlDeniedReason(null);
    setCtlControlling({ connectionId: targetConnectionId, name: "" });
    hubRef.current?.requestControl(targetConnectionId);
  }, []);

  const ctlRespond = useCallback((granted: boolean) => {
    const requester = ctlPendingRequester.current;
    if (requester) hubRef.current?.respondControl(requester, granted);
    if (!granted) {
      setCtlIncoming(null);
      ctlPendingRequester.current = null;
    }
  }, []);

  const ctlSendEvent = useCallback((json: string) => {
    hubRef.current?.sendControlEvent(json);
  }, []);

  const ctlStop = useCallback(() => {
    hubRef.current?.revokeControl();
    setCtlControlledBy(null);
    setCtlControlling(null);
    setCtlRequestState("idle");
  }, []);

  const ctlOnEvent = useCallback((cb: ((json: string) => void) | null) => {
    ctlEventCb.current = cb;
  }, []);

  const control: ControlState = {
    incomingRequest: ctlIncoming,
    respondRequest: ctlRespond,
    controlledBy: ctlControlledBy,
    controlling: ctlControlling,
    requestState: ctlRequestState,
    deniedReason: ctlDeniedReason,
    request: ctlRequest,
    sendEvent: ctlSendEvent,
    stop: ctlStop,
    sessions: ctlSessions,
    desktopPeers,
    onEvent: ctlOnEvent,
  };

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
    renameMeeting,
    replaceOutgoingVideo,
    replaceOutgoingAudio,
    broadcastMediaState,
    control,
  };
}
