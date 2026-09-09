import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { encodeEvent, normalisePointer, type ControlEvent } from "../../lib/meetings/controlEvents";

/**
 * Transparent overlay placed over the shared-screen `<video>` while the local
 * user is the active controller. Captures pointer + keyboard and streams
 * normalised events to the target. Esc (or the Stop button) ends the session.
 */
export default function ControlLayer({
  getVideo,
  onEvent,
  onStop,
  targetName,
}: {
  getVideo: () => HTMLVideoElement | null;
  onEvent: (json: string) => void;
  onStop: () => void;
  targetName: string;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const lastMove = useRef(0);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const send = (e: ControlEvent) => onEvent(encodeEvent(e));

  const pt = (clientX: number, clientY: number) => {
    const v = getVideo();
    return v ? normalisePointer(v, clientX, clientY) : { x: 0, y: 0 };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const now = performance.now();
    if (now - lastMove.current < 20) return; // ~50/s cap
    lastMove.current = now;
    const { x, y } = pt(e.clientX, e.clientY);
    send({ t: "move", x, y });
  };

  const button = (b: number) => (b === 2 ? 2 : b === 1 ? 1 : 0) as 0 | 1 | 2;

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    ref.current?.focus();
    const { x, y } = pt(e.clientX, e.clientY);
    send({ t: "down", button: button(e.button), x, y });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const { x, y } = pt(e.clientX, e.clientY);
    send({ t: "up", button: button(e.button), x, y });
  };
  const onDoubleClick = (e: React.MouseEvent) => {
    const { x, y } = pt(e.clientX, e.clientY);
    send({ t: "dblclick", button: 0, x, y });
  };
  const onWheel = (e: React.WheelEvent) => {
    const { x, y } = pt(e.clientX, e.clientY);
    send({ t: "wheel", dx: e.deltaX, dy: e.deltaY, x, y });
  };
  const onContextMenu = (e: React.MouseEvent) => e.preventDefault();

  const onKey = (e: React.KeyboardEvent, down: boolean) => {
    if (e.key === "Escape") {
      onStop();
      return;
    }
    e.preventDefault();
    send({
      t: "key",
      code: e.code,
      key: e.key,
      down,
      mods: { ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey },
    });
  };

  return (
    <div
      ref={ref}
      className="ctl-layer"
      tabIndex={0}
      role="application"
      aria-label={t("control.controllingAria", { name: targetName })}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
      onWheel={onWheel}
      onContextMenu={onContextMenu}
      onKeyDown={(e) => onKey(e, true)}
      onKeyUp={(e) => onKey(e, false)}
    >
      <div className="ctl-layer__hint">
        {t("control.controllingHint", { name: targetName })}
        <button onClick={onStop}>{t("control.stop")}</button>
      </div>
    </div>
  );
}
