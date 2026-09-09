/**
 * The control-event contract, shared by the controller (who produces events over
 * the shared video) and the target (who forwards them to the CoreMeet Control
 * Agent for OS injection). Coordinates are normalised 0..1 of the shared frame.
 */
export type ControlEvent =
  | { t: "move"; x: number; y: number }
  | { t: "down" | "up" | "click" | "dblclick"; button: 0 | 1 | 2; x: number; y: number }
  | { t: "wheel"; dx: number; dy: number; x: number; y: number }
  | {
      t: "key";
      code: string;
      key: string;
      down: boolean;
      mods: { ctrl: boolean; alt: boolean; shift: boolean; meta: boolean };
    };

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Map a pointer position over a `<video>` element (rendered `object-fit: contain`)
 * to normalised coordinates of the actual video content, ignoring letterbox bars.
 */
export function normalisePointer(
  video: HTMLVideoElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = video.getBoundingClientRect();
  const vw = video.videoWidth || rect.width;
  const vh = video.videoHeight || rect.height;
  const scale = Math.min(rect.width / vw, rect.height / vh);
  const contentW = vw * scale;
  const contentH = vh * scale;
  const offX = (rect.width - contentW) / 2;
  const offY = (rect.height - contentH) / 2;
  return {
    x: clamp01((clientX - rect.left - offX) / contentW),
    y: clamp01((clientY - rect.top - offY) / contentH),
  };
}

export const encodeEvent = (e: ControlEvent) => JSON.stringify(e);
