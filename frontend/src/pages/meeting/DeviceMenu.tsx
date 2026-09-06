import type { MediaControls } from "../../lib/meetings/useMeetingMedia";

/** Camera + microphone pickers. Shared by the lobby and the in-call settings menu. */
export default function DeviceMenu({ media, compact }: { media: MediaControls; compact?: boolean }) {
  return (
    <div className={`devmenu ${compact ? "devmenu--compact" : ""}`}>
      <label className="devmenu__row">
        <span>Camera</span>
        <select
          value={media.currentCameraId ?? ""}
          onChange={(e) => media.switchCamera(e.target.value)}
          disabled={!media.stream || media.devices.cameras.length === 0}
        >
          {media.devices.cameras.length === 0 && <option value="">No camera</option>}
          {media.devices.cameras.map((d, i) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Camera ${i + 1}`}
            </option>
          ))}
        </select>
      </label>
      <label className="devmenu__row">
        <span>Microphone</span>
        <select
          value={media.currentMicId ?? ""}
          onChange={(e) => media.switchMic(e.target.value)}
          disabled={!media.stream || media.devices.mics.length === 0}
        >
          {media.devices.mics.length === 0 && <option value="">No microphone</option>}
          {media.devices.mics.map((d, i) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Microphone ${i + 1}`}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
