import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type DeviceList = { cameras: MediaDeviceInfo[]; mics: MediaDeviceInfo[] };

export type MediaControls = {
  stream: MediaStream | null;
  ready: boolean;
  error: string | null;
  audioOn: boolean;
  videoOn: boolean;
  sharingScreen: boolean;
  devices: DeviceList;
  currentCameraId: string | null;
  currentMicId: string | null;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  switchCamera: (deviceId: string) => Promise<void>;
  switchMic: (deviceId: string) => Promise<void>;
  /** Fires when the outgoing video track is swapped (camera toggle / screen / device switch). */
  onVideoTrackChanged: (cb: (track: MediaStreamTrack | null) => void) => void;
  /** Fires when the outgoing audio track is swapped (mic device switch). */
  onAudioTrackChanged: (cb: (track: MediaStreamTrack | null) => void) => void;
};

/**
 * Owns the local camera/mic stream: permission prompt, mute toggles, screen
 * share, and device switching. The peer mesh subscribes via the `on*Changed`
 * callbacks to `replaceTrack` on every connection.
 */
export function useMeetingMedia(enabled: boolean): MediaControls {
  const { t } = useTranslation();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [devices, setDevices] = useState<DeviceList>({ cameras: [], mics: [] });
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
  const [currentMicId, setCurrentMicId] = useState<string | null>(null);

  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const videoCb = useRef<((t: MediaStreamTrack | null) => void) | null>(null);
  const audioCb = useRef<((t: MediaStreamTrack | null) => void) | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  streamRef.current = stream;

  // refs mirroring state so async callbacks read the latest value
  const videoOnRef = useRef(videoOn);
  videoOnRef.current = videoOn;
  const audioOnRef = useRef(audioOn);
  audioOnRef.current = audioOn;
  const sharingScreenRef = useRef(sharingScreen);
  sharingScreenRef.current = sharingScreen;

  const refreshDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        cameras: list.filter((d) => d.kind === "videoinput"),
        mics: list.filter((d) => d.kind === "audioinput"),
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let local: MediaStream | null = null;

    (async () => {
      try {
        local = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (cancelled) {
          local.getTracks().forEach((t) => t.stop());
          return;
        }
        cameraTrackRef.current = local.getVideoTracks()[0] ?? null;
        setCurrentCameraId(cameraTrackRef.current?.getSettings().deviceId ?? null);
        setCurrentMicId(local.getAudioTracks()[0]?.getSettings().deviceId ?? null);
        setStream(local);
        setReady(true);
        refreshDevices();
        // Labels/ids sometimes populate a beat after the stream starts.
        setTimeout(refreshDevices, 800);
      } catch (e) {
        if (cancelled) return;
        setError(
          (e as DOMException)?.name === "NotAllowedError"
            ? t("errors.cameraBlocked")
            : t("errors.noDevices"),
        );
        setReady(true);
      }
    })();

    navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
    return () => {
      cancelled = true;
      navigator.mediaDevices.removeEventListener("devicechange", refreshDevices);
      local?.getTracks().forEach((t) => t.stop());
      screenTrackRef.current?.stop();
    };
  }, [enabled, refreshDevices]);

  const toggleAudio = useCallback(() => {
    setAudioOn((on) => {
      const next = !on;
      streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
      return next;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setVideoOn((on) => {
      const next = !on;
      const s = streamRef.current;
      s?.getVideoTracks().forEach((t) => (t.enabled = next));
      videoCb.current?.(next ? (s?.getVideoTracks()[0] ?? null) : null);
      return next;
    });
  }, []);

  const switchCamera = useCallback(async (deviceId: string) => {
    const s = streamRef.current;
    if (!s) return;
    try {
      const fresh = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } });
      const track = fresh.getVideoTracks()[0];
      if (!track) return;
      track.enabled = videoOnRef.current;
      cameraTrackRef.current = track;
      if (!sharingScreenRef.current) {
        replaceTrackOfKind(s, "video", track);
        videoCb.current?.(videoOnRef.current ? track : null);
      }
      setCurrentCameraId(deviceId);
      refreshDevices();
    } catch {
      /* ignore */
    }
  }, [refreshDevices]);

  const switchMic = useCallback(async (deviceId: string) => {
    const s = streamRef.current;
    if (!s) return;
    try {
      const fresh = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true },
      });
      const track = fresh.getAudioTracks()[0];
      if (!track) return;
      track.enabled = audioOnRef.current;
      replaceTrackOfKind(s, "audio", track);
      audioCb.current?.(track);
      setCurrentMicId(deviceId);
      refreshDevices();
    } catch {
      /* ignore */
    }
  }, [refreshDevices]);

  const toggleScreenShare = useCallback(async () => {
    const s = streamRef.current;
    if (!s) return;
    if (sharingScreen) {
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      const cam = cameraTrackRef.current;
      if (cam) {
        replaceTrackOfKind(s, "video", cam);
        videoCb.current?.(cam);
      }
      setSharingScreen(false);
      return;
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = display.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;
      screenTrack.onended = () => {
        const cam = cameraTrackRef.current;
        if (cam) {
          replaceTrackOfKind(s, "video", cam);
          videoCb.current?.(cam);
        }
        screenTrackRef.current = null;
        setSharingScreen(false);
      };
      replaceTrackOfKind(s, "video", screenTrack);
      videoCb.current?.(screenTrack);
      setSharingScreen(true);
      setVideoOn(true);
    } catch {
      /* user cancelled the picker */
    }
  }, [sharingScreen]);

  const onVideoTrackChanged = useCallback((cb: (t: MediaStreamTrack | null) => void) => {
    videoCb.current = cb;
  }, []);
  const onAudioTrackChanged = useCallback((cb: (t: MediaStreamTrack | null) => void) => {
    audioCb.current = cb;
  }, []);

  return {
    stream,
    ready,
    error,
    audioOn,
    videoOn,
    sharingScreen,
    devices,
    currentCameraId,
    currentMicId,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    switchCamera,
    switchMic,
    onVideoTrackChanged,
    onAudioTrackChanged,
  };
}

function replaceTrackOfKind(stream: MediaStream, kind: "video" | "audio", next: MediaStreamTrack) {
  stream.getTracks().forEach((t) => {
    if (t.kind === kind && t !== next) {
      stream.removeTrack(t);
      t.stop();
    }
  });
  if (!stream.getTracks().includes(next)) stream.addTrack(next);
}
