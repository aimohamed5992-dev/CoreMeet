import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "../../components/Logo";
import Avatar from "../../components/Avatar";
import ThemeToggle from "../../components/ThemeToggle";
import LanguageToggle from "../../components/LanguageToggle";
import DeviceMenu from "./DeviceMenu";
import { MicIcon, MicOffIcon, CamIcon, CamOffIcon } from "../../components/meet-icons";
import type { MediaControls } from "../../lib/meetings/useMeetingMedia";
import type { MeetingDetail } from "../../lib/meetings/types";
import { fileToAvatarDataUrl } from "../../lib/image";
import "./Lobby.css";

type Props = {
  media: MediaControls;
  meeting: MeetingDetail | null;
  loadingMeeting: boolean;
  notFound: boolean;
  isGuest: boolean;
  displayName: string;
  avatarUrl: string | null;
  avatarColor: string;
  onNameChange: (name: string) => void;
  onAvatarChange: (url: string | null) => void;
  onJoin: () => void;
};

export default function Lobby({
  media,
  meeting,
  loadingMeeting,
  notFound,
  isGuest,
  displayName,
  avatarUrl,
  avatarColor,
  onNameChange,
  onAvatarChange,
  onJoin,
}: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el && media.stream) {
      el.srcObject = media.stream;
      el.play().catch(() => undefined);
    }
  }, [media.stream]);

  const connected = meeting?.participants.filter((p) => p.isConnected) ?? [];
  const canJoin = !loadingMeeting && (!isGuest || displayName.trim().length >= 1);

  const pickAvatar = async (file: File | undefined) => {
    if (!file) return;
    setAvatarError(null);
    try {
      onAvatarChange(await fileToAvatarDataUrl(file));
    } catch (e) {
      setAvatarError(t((e as Error).message));
    }
  };

  const peopleLine =
    connected.length === 0
      ? t("lobby.firstHere")
      : connected.length === 1
        ? t("lobby.onePersonIn")
        : t("lobby.peopleIn", { count: connected.length });

  if (notFound) {
    return (
      <div className="lobby lobby--message">
        <Logo size={32} />
        <h1>{t("lobby.notFoundTitle")}</h1>
        <p>{t("lobby.notFoundText")}</p>
        <Link to="/" className="btn btn--primary">{t("common.backToCoreMeet")}</Link>
      </div>
    );
  }

  return (
    <div className="lobby">
      <div className="lobby__preview">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="lobby__video"
          style={{
            transform: "scaleX(-1)",
            display: media.stream && media.videoOn ? "block" : "none",
          }}
        />
        {(!media.stream || !media.videoOn) && (
          <div className="lobby__video-off">
            <Avatar user={{ name: displayName || t("common.you"), avatarColor, avatarUrl }} size={96} />
            <span>{media.error ? t("lobby.cameraUnavailable") : t("lobby.cameraOff")}</span>
          </div>
        )}

        <div className="lobby__preview-controls">
          <button
            className={`lobby__pill ${media.audioOn ? "" : "lobby__pill--off"}`}
            onClick={media.toggleAudio}
            disabled={!media.stream}
            aria-label={t("room.micTitle")}
          >
            {media.audioOn ? <MicIcon width={18} height={18} /> : <MicOffIcon width={18} height={18} />}
          </button>
          <button
            className={`lobby__pill ${media.videoOn ? "" : "lobby__pill--off"}`}
            onClick={media.toggleVideo}
            disabled={!media.stream}
            aria-label={t("room.camTitle")}
          >
            {media.videoOn ? <CamIcon width={18} height={18} /> : <CamOffIcon width={18} height={18} />}
          </button>
        </div>
      </div>

      <div className="lobby__panel">
        <div className="lobby__panel-top">
          <Link to="/" className="lobby__logo"><Logo size={28} /></Link>
          <div className="lobby__panel-toggles">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <h1>{loadingMeeting ? t("lobby.gettingReady") : (meeting?.title ?? t("lobby.meeting"))}</h1>
        <p className="lobby__sub">{peopleLine}</p>

        {connected.length > 0 && (
          <div className="lobby__faces">
            {connected.slice(0, 5).map((p) => (
              <span key={p.id} title={p.displayName}>
                <Avatar user={{ name: p.displayName, avatarColor: p.avatarColor, avatarUrl: p.avatarUrl }} size={30} />
              </span>
            ))}
            {connected.length > 5 && <span className="lobby__more">+{connected.length - 5}</span>}
          </div>
        )}

        {isGuest && (
          <div className="lobby__guest">
            <button
              type="button"
              className="lobby__avatar-pick"
              onClick={() => fileRef.current?.click()}
              title={t("lobby.choosePicture")}
            >
              <Avatar user={{ name: displayName || "?", avatarColor, avatarUrl }} size={56} />
              <span>{avatarUrl ? t("lobby.changePhotoShort") : t("lobby.addPhoto")}</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => pickAvatar(e.target.files?.[0])}
            />
            <label className="field lobby__name">
              <span>{t("lobby.yourName")}</span>
              <input
                className="input"
                placeholder={t("lobby.namePlaceholder")}
                value={displayName}
                maxLength={60}
                onChange={(e) => onNameChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canJoin && onJoin()}
              />
            </label>
            {avatarUrl && (
              <button type="button" className="lobby__avatar-clear" onClick={() => onAvatarChange(null)}>
                {t("lobby.removePhoto")}
              </button>
            )}
          </div>
        )}

        {avatarError && <p className="lobby__warn">{avatarError}</p>}
        {media.error && <p className="lobby__warn">{media.error}</p>}

        <DeviceMenu media={media} />

        <button className="btn btn--primary btn--lg lobby__join" onClick={onJoin} disabled={!canJoin}>
          {isGuest ? t("lobby.joinMeeting") : t("lobby.joinNow")}
        </button>
        <Link to="/" className="lobby__cancel">{t("lobby.cancel")}</Link>

        {isGuest && (
          <p className="lobby__signin-hint">
            {t("lobby.signinHintText")} <Link to="/login">{t("lobby.signinHintLink")}</Link> {t("lobby.signinHintTail")}
          </p>
        )}
      </div>
    </div>
  );
}
