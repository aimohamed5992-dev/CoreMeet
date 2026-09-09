import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Avatar from "../../components/Avatar";
import { MicOffIcon } from "../../components/meet-icons";

type Props = {
  stream: MediaStream | null;
  name: string;
  avatarColor: string;
  avatarUrl?: string | null;
  muted?: boolean;
  mirror?: boolean;
  isSelf?: boolean;
  audioOff?: boolean;
  videoOff?: boolean;
  screen?: boolean;
  /** Fit the video with letterboxing rather than cropping (for shared screens). */
  contain?: boolean;
};

export default function VideoTile({
  stream,
  name,
  avatarColor,
  avatarUrl,
  muted,
  mirror,
  isSelf,
  audioOff,
  videoOff,
  screen,
  contain,
}: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [trackLive, setTrackLive] = useState(false);
  const hasVideo = trackLive && !videoOff;

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) {
      setTrackLive(false);
      return;
    }
    el.srcObject = stream;
    el.play().catch(() => undefined);

    const update = () => {
      const track = stream.getVideoTracks()[0];
      setTrackLive(!!track && track.enabled && track.readyState === "live" && !track.muted);
    };
    update();
    stream.addEventListener("addtrack", update);
    stream.addEventListener("removetrack", update);
    const id = window.setInterval(update, 1000);
    return () => {
      stream.removeEventListener("addtrack", update);
      stream.removeEventListener("removetrack", update);
      window.clearInterval(id);
    };
  }, [stream]);

  return (
    <div className={`vtile ${hasVideo ? "vtile--live" : ""} ${screen ? "vtile--screen" : ""}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="vtile__video"
        style={{
          display: hasVideo ? "block" : "none",
          transform: mirror && !screen ? "scaleX(-1)" : undefined,
          objectFit: contain || screen ? "contain" : "cover",
        }}
      />
      {!hasVideo && (
        <div className="vtile__placeholder">
          <Avatar user={{ name, avatarColor, avatarUrl }} size={72} />
        </div>
      )}
      <div className="vtile__bar">
        {audioOff && (
          <span className="vtile__mute" title={t("room.muted")}>
            <MicOffIcon width={14} height={14} />
          </span>
        )}
        <span className="vtile__name">
          {name}
          {isSelf ? t("common.youParen") : ""}
        </span>
        {screen && <span className="vtile__tag">{t("room.presenting")}</span>}
      </div>
    </div>
  );
}
