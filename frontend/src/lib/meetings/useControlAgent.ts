import { useCallback, useEffect, useRef, useState } from "react";

/** Local port the CoreMeet Control Agent listens on (see the agent, step 5). */
const AGENT_URL = "ws://127.0.0.1:47800";

export type AgentStatus = "idle" | "connecting" | "connected" | "absent";

/**
 * Bridges incoming control events to the locally-installed CoreMeet Control
 * Agent, which injects them into the OS. Without the agent the events still
 * arrive (the target can see the remote cursor) but nothing is clicked.
 *
 * `active` — turn the bridge on only while this machine is actually being controlled.
 * `controllerName` — shown in the agent's status window / tray while a session is live.
 */
export function useControlAgent(active: boolean, controllerName?: string | null) {
  const [status, setStatus] = useState<AgentStatus>("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const attemptsRef = useRef(0);
  const nameRef = useRef(controllerName);
  nameRef.current = controllerName;
  const sentStartRef = useRef(false);

  useEffect(() => {
    if (!active) {
      wsRef.current?.close();
      wsRef.current = null;
      setStatus("idle");
      attemptsRef.current = 0;
      return;
    }

    let cancelled = false;
    let retry: number | undefined;

    const connect = () => {
      if (cancelled) return;
      setStatus("connecting");
      let ws: WebSocket;
      try {
        ws = new WebSocket(AGENT_URL);
      } catch {
        setStatus("absent");
        return;
      }
      wsRef.current = ws;
      ws.onopen = () => {
        attemptsRef.current = 0;
        setStatus("connected");
        ws.send(JSON.stringify({ t: "hello", app: "coremeet" }));
        if (nameRef.current) {
          sentStartRef.current = true;
          ws.send(JSON.stringify({ t: "session", state: "start", by: nameRef.current }));
        }
      };
      ws.onclose = () => {
        if (cancelled) return;
        wsRef.current = null;
        attemptsRef.current += 1;
        if (attemptsRef.current >= 3) {
          setStatus("absent");
        } else {
          setStatus("connecting");
          retry = window.setTimeout(connect, 1500);
        }
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      cancelled = true;
      window.clearTimeout(retry);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [active]);

  const send = useCallback((json: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(json);
  }, []);

  // Keep the agent's "who is controlling" label in sync once connected.
  useEffect(() => {
    if (status !== "connected") return;
    if (controllerName) {
      sentStartRef.current = true;
      send(JSON.stringify({ t: "session", state: "start", by: controllerName }));
    } else if (sentStartRef.current) {
      sentStartRef.current = false;
      send(JSON.stringify({ t: "session", state: "stop" }));
    }
  }, [status, controllerName, send]);

  return { status, send };
}
