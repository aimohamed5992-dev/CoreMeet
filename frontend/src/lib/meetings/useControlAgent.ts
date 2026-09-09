import { useCallback, useEffect, useRef, useState } from "react";

export type AgentStatus = "idle" | "connecting" | "connected" | "absent";

type DesktopControl = {
  injectEvent: (json: string) => void;
  setActive: (active: boolean, byName?: string | null) => void;
  accessibilityOk: () => boolean;
  requestAccessibility: () => void;
  onPauseChanged: (cb: (paused: boolean) => void) => () => void;
  onBlocked: (cb: (reason: string) => void) => () => void;
};

function desktopControl(): DesktopControl | null {
  const d = (window as unknown as { coremeetDesktop?: { control?: DesktopControl } })
    .coremeetDesktop;
  return d?.control ?? null;
}

/**
 * Delivers relayed control events to the OS while this machine is being
 * controlled. Only the **CoreMeet desktop app** can inject input — in a plain
 * browser there is nothing to inject into, so the status stays `absent`.
 *
 * `active` — true only while a control session is live.
 * `controllerName` — who is driving, for the desktop app's session state.
 */
export function useControlAgent(active: boolean, controllerName?: string | null) {
  const [status, setStatus] = useState<AgentStatus>("idle");
  const ctl = useRef<DesktopControl | null>(desktopControl());

  useEffect(() => {
    const d = ctl.current;
    if (!d) {
      setStatus(active ? "absent" : "idle");
      return;
    }
    if (!active) {
      d.setActive(false);
      setStatus("idle");
      return;
    }
    d.setActive(true, controllerName ?? null);
    setStatus(d.accessibilityOk() ? "connected" : "absent");

    const offBlocked = d.onBlocked(() => setStatus("absent"));
    return () => {
      offBlocked();
      d.setActive(false);
    };
  }, [active, controllerName]);

  const send = useCallback((json: string) => {
    ctl.current?.injectEvent(json);
  }, []);

  return { status, send };
}
