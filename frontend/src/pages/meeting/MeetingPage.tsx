import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth/AuthContext";
import type { MediaControls } from "../../lib/meetings/useMeetingMedia";
import { useMeetingRoom } from "../../lib/meetings/useMeetingRoom";
import { meetingsApi } from "../../lib/meetings/meetingsApi";
import type { Participant } from "../../lib/meetings/types";
import Logo from "../../components/Logo";
import ThemeToggle from "../../components/ThemeToggle";
import VideoTile from "./VideoTile";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatPanel from "./ChatPanel";
import DeviceMenu from "./DeviceMenu";
import {
  MicIcon, MicOffIcon, CamIcon, CamOffIcon,
  PresentIcon, PresentOffIcon, ChatIcon, PeopleIcon, CallEndIcon, TuneIcon, LinkIcon,
} from "../../components/meet-icons";
import "./MeetingPage.css";

type SidePanel = "none" | "people" | "chat";

export default function MeetingPage({
  code,
  media,
  guest,
}: {
  code: string;
  media: MediaControls;
  guest?: { displayName: string; avatarUrl: string | null };
}) {
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const room = useMeetingRoom(code, { localStream: media.stream, mediaSettled: media.ready, guest });
  const { replaceOutgoingVideo, replaceOutgoingAudio, broadcastMediaState } = room;
  const { onVideoTrackChanged, onAudioTrackChanged, toggleAudio, toggleVideo } = media;

  const [panel, setPanel] = useState<SidePanel>("none");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onVideoTrackChanged(replaceOutgoingVideo);
    onAudioTrackChanged(replaceOutgoingAudio);
  }, [onVideoTrackChanged, onAudioTrackChanged, replaceOutgoingVideo, replaceOutgoingAudio]);

  useEffect(() => {
    broadcastMediaState(media.audioOn, media.videoOn, media.sharingScreen);
  }, [media.audioOn, media.videoOn, media.sharingScreen, broadcastMediaState]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if (ev.key === "m") toggleAudio();
      else if (ev.key === "e") toggleVideo();
      else if (ev.key === "c") setPanel((p) => (p === "chat" ? "none" : "chat"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleAudio, toggleVideo]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isHost = !!user && room.meeting?.hostId === user.id;

  const participantById = useMemo(() => {
    const map = new Map<string, Participant>();
    room.participants.forEach((p) => map.set(p.id, p));
    return map;
  }, [room.participants]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${location.origin}/meeting/${code}`).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const leave = () => navigate(status === "authenticated" ? "/app" : "/");
  const endMeeting = async () => {
    if (!window.confirm("End the meeting for everyone?")) return;
    await meetingsApi.end(code).catch(() => undefined);
    navigate("/app");
  };

  if (room.connState === "error") {
    return (
      <div className="room room--message">
        <Logo size={32} />
        <h1>Can’t join this meeting</h1>
        <p>{room.error ?? "The meeting link may be invalid or the meeting has ended."}</p>
        <button className="btn btn--primary" onClick={leave}>Back to CoreMeet</button>
      </div>
    );
  }

  // ---- tiles -----------------------------------------------------
  const selfTile = {
    key: "self",
    stream: media.stream,
    name: `${room.me?.displayName ?? guest?.displayName ?? user?.name ?? "You"}`,
    avatarColor: room.me?.avatarColor ?? user?.avatarColor ?? "#1FA84C",
    avatarUrl: room.me?.avatarUrl ?? user?.avatarUrl ?? guest?.avatarUrl ?? null,
    isSelf: true,
    mirror: !media.sharingScreen,
    audioOff: !media.audioOn,
    videoOff: !media.videoOn && !media.sharingScreen,
    screen: media.sharingScreen,
  };
  const remoteTiles = room.remoteFeeds.map((feed) => {
    const p = feed.participantId ? participantById.get(feed.participantId) : undefined;
    const ms = room.remoteMedia[feed.connectionId];
    return {
      key: feed.connectionId,
      stream: feed.stream,
      name: p?.displayName ?? "Guest",
      avatarColor: p?.avatarColor ?? "#667a6f",
      avatarUrl: p?.avatarUrl ?? null,
      isSelf: false,
      mirror: false,
      audioOff: ms?.audio === false,
      videoOff: ms?.video === false,
      screen: ms?.screen === true,
    };
  });
  const allTiles = [selfTile, ...remoteTiles];
  const presenter = allTiles.find((t) => t.screen) ?? null;
  const others = presenter ? allTiles.filter((t) => t !== presenter) : allTiles;
  const connectedCount = room.participants.filter((p) => p.isConnected).length;

  const renderTile = (t: (typeof allTiles)[number], big = false) => (
    <VideoTile
      key={t.key}
      stream={t.stream}
      name={t.name}
      avatarColor={t.avatarColor}
      avatarUrl={t.avatarUrl}
      muted={t.isSelf}
      mirror={t.mirror}
      isSelf={t.isSelf}
      audioOff={t.audioOff}
      videoOff={t.videoOff}
      screen={t.screen}
      contain={big && t.screen}
    />
  );

  return (
    <div className="room">
      <header className="room__top">
        <Logo size={22} />
        <div className="room__meta">
          <strong>{room.meeting?.title ?? "Meeting"}</strong>
          <button className="room__code" onClick={copyLink} title="Copy meeting link">
            <LinkIcon width={14} height={14} /> {copied ? "Link copied" : code}
          </button>
        </div>
        <div className="room__top-right">
          <ThemeToggle className="room__theme" />
          <span className={`room__status room__status--${room.connState}`}>
            {room.connState === "connected" ? "Live" : room.connState}
          </span>
        </div>
      </header>

      {media.error && <div className="room__banner">{media.error}</div>}

      <div className="room__body">
        <main className={`room__stage ${presenter ? "room__stage--present" : ""}`}>
          {presenter ? (
            <>
              <div className="room__spotlight">{renderTile(presenter, true)}</div>
              <div className="room__rail">{others.map((t) => renderTile(t))}</div>
            </>
          ) : (
            <div className="room__grid" data-count={Math.min(allTiles.length, 9)}>
              {allTiles.map((t) => renderTile(t))}
            </div>
          )}
          {allTiles.length === 1 && !presenter && (
            <p className="room__solo">
              You’re the only one here. <button onClick={copyLink}>Copy the link</button> to invite people.
            </p>
          )}
        </main>

        {panel === "people" && (
          <ParticipantsPanel
            participants={room.participants}
            hostId={room.meeting?.hostId}
            meId={room.me?.id}
            onClose={() => setPanel("none")}
          />
        )}
        {panel === "chat" && (
          <ChatPanel
            messages={room.messages}
            meId={room.me?.id}
            onSend={room.sendMessage}
            onClose={() => setPanel("none")}
          />
        )}
      </div>

      <footer className="room__controls">
        <button
          className={`meet-btn ${media.audioOn ? "" : "meet-btn--off"}`}
          onClick={media.toggleAudio}
          disabled={!media.stream}
          title="Turn microphone on/off (m)"
        >
          {media.audioOn ? <MicIcon /> : <MicOffIcon />}
        </button>
        <button
          className={`meet-btn ${media.videoOn ? "" : "meet-btn--off"}`}
          onClick={media.toggleVideo}
          disabled={!media.stream}
          title="Turn camera on/off (e)"
        >
          {media.videoOn ? <CamIcon /> : <CamOffIcon />}
        </button>
        <button
          className={`meet-btn ${media.sharingScreen ? "meet-btn--active" : ""}`}
          onClick={media.toggleScreenShare}
          disabled={!media.stream}
          title={media.sharingScreen ? "Stop presenting" : "Present now"}
        >
          {media.sharingScreen ? <PresentOffIcon /> : <PresentIcon />}
        </button>

        <div className="room__settings" ref={settingsRef}>
          <button
            className={`meet-btn ${settingsOpen ? "meet-btn--active" : ""}`}
            onClick={() => setSettingsOpen((v) => !v)}
            title="Settings"
          >
            <TuneIcon />
          </button>
          {settingsOpen && (
            <div className="room__settings-pop">
              <DeviceMenu media={media} compact />
            </div>
          )}
        </div>

        <button
          className={`meet-btn ${panel === "people" ? "meet-btn--active" : ""}`}
          onClick={() => setPanel((p) => (p === "people" ? "none" : "people"))}
          title="Show everyone"
        >
          <PeopleIcon />
          <span className="meet-btn__badge">{connectedCount}</span>
        </button>
        <button
          className={`meet-btn ${panel === "chat" ? "meet-btn--active" : ""}`}
          onClick={() => setPanel((p) => (p === "chat" ? "none" : "chat"))}
          title="Chat with everyone (c)"
        >
          <ChatIcon />
        </button>

        <button className="meet-btn meet-btn--end" onClick={isHost ? endMeeting : leave} title="Leave call">
          <CallEndIcon />
        </button>
      </footer>
    </div>
  );
}
