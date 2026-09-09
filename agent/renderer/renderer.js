"use strict";

const $ = (id) => document.getElementById(id);
let current = {};

function render(s) {
  if (!s) return;
  current = s;
  const live = !!s.controlledBy;
  $("dot").className = "dot" + (live ? " dot--live" : s.connected ? " dot--on" : "");

  $("statusTitle").textContent = s.paused
    ? "Input paused"
    : live
      ? `${s.controlledBy} is controlling this computer`
      : s.connected
        ? "CoreMeet connected"
        : s.listening
          ? "Waiting for CoreMeet"
          : "Not running";

  $("statusSub").textContent = s.paused
    ? "Control requests are blocked until you resume."
    : live
      ? "Move the pointer here or press Pause to take over instantly."
      : s.connected
        ? "A meeting tab is linked. Nothing happens until you approve a request."
        : "Open your CoreMeet meeting and share your screen.";

  $("accWarn").hidden = !!s.accessibility;
  $("pauseBtn").textContent = s.paused ? "Resume input" : "Pause input";
  $("pauseBtn").className = "block" + (s.paused ? " primary" : " danger");
  $("port").textContent = s.port ?? "47800";
  $("screen").textContent = s.screen && s.screen.width ? `${s.screen.width}×${s.screen.height}` : "—";
}

$("pauseBtn").addEventListener("click", async () => {
  await window.agent.setPaused(!current.paused);
  render(await window.agent.getState());
});
$("accOpen").addEventListener("click", () => window.agent.requestAccessibility());
$("accRecheck").addEventListener("click", async () => {
  await window.agent.recheckAccessibility();
  render(await window.agent.getState());
});
$("quit").addEventListener("click", (e) => { e.preventDefault(); window.agent.quit(); });

window.agent.onState(render);
window.agent.getState().then(render);
