"use strict";

const { EventEmitter } = require("events");
const { WebSocketServer } = require("ws");

const MAX_MESSAGE_BYTES = 4096;
const LOOPBACK_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

/**
 * Loopback-only WebSocket server the CoreMeet web page connects to when its
 * user is being remotely controlled. It never listens on a public interface,
 * accepts one page at a time, and only relays already-consented input — the
 * consent gate lives in the meeting UI, not here.
 *
 * Events: "listening", "connect" {origin}, "disconnect", "control" {event},
 * "session" {state,by}, "blocked" {reason}, "warn" {error}.
 *
 * Note: "warn" (not the reserved "error") so a missing listener never crashes
 * the agent. `start()` still rejects on a listen failure.
 */
class ControlServer extends EventEmitter {
  constructor({ port = 47800, host = "127.0.0.1", allowedOrigins = [] } = {}) {
    super();
    this.port = port;
    this.host = host;
    this.allowedOrigins = new Set(allowedOrigins);
    this.wss = null;
    this.client = null;
  }

  start() {
    return new Promise((resolve, reject) => {
      this.wss = new WebSocketServer({
        host: this.host,
        port: this.port,
        maxPayload: MAX_MESSAGE_BYTES,
        verifyClient: ({ origin }, done) => {
          if (this._originAllowed(origin)) return done(true);
          this.emit("blocked", { reason: "origin", origin });
          done(false, 403, "origin not allowed");
        },
      });
      this.wss.on("listening", () => {
        this.emit("listening", { port: this.port });
        resolve();
      });
      this.wss.on("error", (error) => {
        this.emit("warn", { error });
        reject(error);
      });
      this.wss.on("connection", (ws, req) => this._onConnection(ws, req));
    });
  }

  _originAllowed(origin) {
    if (!origin) return true; // non-browser (tests / CLI); loopback bind is the real guard
    if (LOOPBACK_ORIGIN.test(origin)) return true;
    return this.allowedOrigins.has(origin);
  }

  _onConnection(ws, req) {
    const origin = req.headers.origin;

    // One controlled page at a time — a reload replaces the old socket.
    if (this.client && this.client.readyState === this.client.OPEN) {
      this.client.close(4000, "replaced");
    }
    this.client = ws;
    this.emit("connect", { origin });

    ws.on("message", (raw) => {
      if (raw.length > MAX_MESSAGE_BYTES) return;
      let msg;
      try {
        msg = JSON.parse(raw.toString("utf8"));
      } catch {
        return;
      }
      if (!msg || typeof msg.t !== "string") return;

      if (msg.t === "hello") {
        ws.send(JSON.stringify({ t: "welcome", app: "coremeet-control-agent" }));
        return;
      }
      if (msg.t === "session") {
        this.emit("session", { state: msg.state === "stop" ? "stop" : "start", by: typeof msg.by === "string" ? msg.by : null });
        return;
      }
      this.emit("control", { event: msg });
    });

    ws.on("close", () => {
      if (this.client === ws) {
        this.client = null;
        this.emit("disconnect");
      }
    });
    ws.on("error", (error) => this.emit("warn", { error }));
  }

  /** Tell the page we've paused injection (kill switch), best-effort. */
  notify(payload) {
    if (this.client && this.client.readyState === this.client.OPEN) {
      this.client.send(JSON.stringify(payload));
    }
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.wss) return resolve();
      for (const c of this.wss.clients) c.terminate();
      this.wss.close(() => resolve());
      this.wss = null;
      this.client = null;
    });
  }
}

module.exports = { ControlServer, MAX_MESSAGE_BYTES };
