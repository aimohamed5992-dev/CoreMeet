import { useTranslation } from "react-i18next";
import type { MediaControls } from "../../lib/meetings/useMeetingMedia";

/** Camera + microphone pickers. Shared by the lobby and the in-call settings menu. */
export default function DeviceMenu({ media, compact }: { media: MediaControls; compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={`devmenu ${compact ? "devmenu--compact" : ""}`}>
      <label className="devmenu__row">
        <span>{t("devices.camera")}</span>
        <select
          value={media.currentCameraId ?? ""}
          onChange={(e) => media.switchCamera(e.target.value)}
          disabled={!media.stream || media.devices.cameras.length === 0}
        >
          {media.devices.cameras.length === 0 && <option value="">{t("devices.noCamera")}</option>}
          {media.devices.cameras.map((d, i) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || t("devices.cameraN", { n: i + 1 })}
            </option>
          ))}
        </select>
      </label>
      <label className="devmenu__row">
        <span>{t("devices.microphone")}</span>
        <select
          value={media.currentMicId ?? ""}
          onChange={(e) => media.switchMic(e.target.value)}
          disabled={!media.stream || media.devices.mics.length === 0}
        >
          {media.devices.mics.length === 0 && <option value="">{t("devices.noMicrophone")}</option>}
          {media.devices.mics.map((d, i) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || t("devices.microphoneN", { n: i + 1 })}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
