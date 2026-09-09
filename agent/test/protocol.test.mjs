import { test } from "node:test";
import assert from "node:assert/strict";
import { WebSocket } from "ws";
import { ControlServer, MAX_MESSAGE_BYTES } from "../src/server.js";
import { Injector } from "../src/injector.js";

/** Spin a server + dry-run injector on an ephemeral port and connect a client. */
async function harness() {
  const injector = new Injector({ dryRun: true });
  await injector.ready();
  const server = new ControlServer({ port: 0, allowedOrigins: ["https://coremeet.example"] });
  server.on("control", ({ event }) => injector.apply(event));
  await server.start();
  const { port } = server.wss.address();

  const connect = (origin = "http://localhost:5173") =>
    new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}`, { headers: origin ? { origin } : {} });
      ws.once("open", () => resolve(ws));
      ws.once("error", reject);
    });

  return { server, injector, connect, close: () => server.stop() };
}

const nextMessage = (ws) => new Promise((r) => ws.once("message", (m) => r(JSON.parse(m.toString()))));
const nextEvent = (emitter, name) => new Promise((r) => emitter.once(name, r));
const tick = () => new Promise((r) => setTimeout(r, 50));
const settle = async (h) => { await tick(); await h.injector.idle(); };

test("hello handshake returns welcome", async () => {
  const h = await harness();
  const ws = await h.connect();
  ws.send(JSON.stringify({ t: "hello", app: "coremeet" }));
  assert.deepEqual(await nextMessage(ws), { t: "welcome", app: "coremeet-control-agent" });
  ws.close();
  await h.close();
});

test("normalised coordinates map onto the screen", async () => {
  const h = await harness();
  const ws = await h.connect();
  ws.send(JSON.stringify({ t: "move", x: 0.5, y: 0.5 }));
  ws.send(JSON.stringify({ t: "move", x: 0, y: 0 }));
  ws.send(JSON.stringify({ t: "move", x: 1, y: 1 }));
  await settle(h);
  assert.deepEqual(h.injector.log, [
    { t: "move", px: 960, py: 540 },
    { t: "move", px: 0, py: 0 },
    { t: "move", px: 1919, py: 1079 },
  ]);
  ws.close();
  await h.close();
});

test("click and key events reach the injector; auto-repeat is dropped", async () => {
  const h = await harness();
  const ws = await h.connect();
  ws.send(JSON.stringify({ t: "down", button: 0, x: 0.1, y: 0.1 }));
  ws.send(JSON.stringify({ t: "up", button: 0, x: 0.1, y: 0.1 }));
  ws.send(JSON.stringify({ t: "key", code: "KeyA", key: "a", down: true, mods: {} }));
  ws.send(JSON.stringify({ t: "key", code: "KeyA", key: "a", down: true, mods: {} })); // repeat
  ws.send(JSON.stringify({ t: "key", code: "KeyA", key: "a", down: false, mods: {} }));
  await settle(h);
  const kinds = h.injector.log.map((e) => e.t);
  assert.deepEqual(kinds, ["move", "down", "move", "up", "keydown", "keyup"]);
  ws.close();
  await h.close();
});

test("session frames are surfaced, not treated as input", async () => {
  const h = await harness();
  const ws = await h.connect();
  const p = nextEvent(h.server, "session");
  ws.send(JSON.stringify({ t: "session", state: "start", by: "Dana" }));
  assert.deepEqual(await p, { state: "start", by: "Dana" });
  await settle(h);
  assert.equal(h.injector.log.length, 0);
  ws.close();
  await h.close();
});

test("oversized frames are ignored", async () => {
  const h = await harness();
  const ws = await h.connect();
  ws.on("error", () => {}); // ws may drop us for exceeding maxPayload
  ws.send(JSON.stringify({ t: "move", x: 0.5, y: 0.5, pad: "z".repeat(MAX_MESSAGE_BYTES) }));
  await settle(h);
  assert.equal(h.injector.log.length, 0);
  try { ws.close(); } catch {}
  await h.close();
});

test("a second page connection replaces the first", async () => {
  const h = await harness();
  const a = await h.connect();
  const closedA = new Promise((r) => a.once("close", (code) => r(code)));
  const b = await h.connect();
  assert.equal(await closedA, 4000);
  b.send(JSON.stringify({ t: "move", x: 0.25, y: 0.25 }));
  await settle(h);
  assert.deepEqual(h.injector.log.at(-1), { t: "move", px: 480, py: 270 });
  b.close();
  await h.close();
});

test("disallowed origin is rejected", async () => {
  const h = await harness();
  await assert.rejects(h.connect("https://evil.example"));
  await h.close();
});
