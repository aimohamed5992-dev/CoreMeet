import { useCallback, useEffect, useRef, useState } from "react";

export type RecordingStatus = "idle" | "recording";

const MIME_CANDIDATES = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? "video/webm";
}

/**
 * Local screen recording. There is no media server in this peer-to-peer
 * architecture, so recording happens entirely on the viewer's device: it mixes
 * every participant's audio (local mic + each remote peer) with a chosen video
 * track (whoever is spotlighted — the shared screen when someone is presenting,
 * otherwise your own camera) and saves a .webm file when stopped. Nothing is
 * uploaded; each person who records gets their own file.
 */
export function useRecording() {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const supported = typeof MediaRecorder !== "undefined" && typeof AudioContext !== "undefined";

  const teardown = useCallback(() => {
    audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    recorderRef.current = null;
  }, []);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const start = useCallback(
    (videoTrack: MediaStreamTrack | null | undefined, audioStreams: (MediaStream | null | undefined)[]) => {
      if (!supported || !videoTrack || recorderRef.current) return;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const dest = ctx.createMediaStreamDestination();
      let anyAudio = false;
      for (const s of audioStreams) {
        if (!s || s.getAudioTracks().length === 0) continue;
        try {
          ctx.createMediaStreamSource(s).connect(dest);
          anyAudio = true;
        } catch {
          /* ignore — e.g. a stream that can't be connected twice */
        }
      }

      const tracks = [videoTrack, ...(anyAudio ? dest.stream.getAudioTracks() : [])];
      const mimeType = pickMimeType();
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(new MediaStream(tracks), mimeType ? { mimeType } : undefined);
      } catch {
        teardown();
        return;
      }

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
        chunksRef.current = [];
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cloud-meet-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
        teardown();
        setStatus("idle");
      };
      recorder.start(1000);
      recorderRef.current = recorder;
      setStatus("recording");
    },
    [supported, teardown],
  );

  useEffect(
    () => () => {
      recorderRef.current?.stop();
      teardown();
    },
    [teardown],
  );

  return { status, supported, start, stop };
}
