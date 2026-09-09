"use strict";

const grid = document.getElementById("grid");
const tabs = [...document.querySelectorAll(".tabs button")];
let all = [];
let kind = "screen";

function render() {
  const items = all.filter((s) => s.kind === kind);
  grid.innerHTML = "";
  if (items.length === 0) {
    const p = document.createElement("div");
    p.className = "empty";
    p.textContent = kind === "screen" ? "No screens found." : "No open windows.";
    grid.append(p);
    return;
  }
  for (const s of items) {
    const btn = document.createElement("button");
    btn.className = "src";
    btn.title = s.name;
    btn.onclick = () => window.picker.choose(s.id);

    const thumb = document.createElement("img");
    thumb.className = "thumb";
    thumb.src = s.thumbnail;

    const label = document.createElement("div");
    label.className = "label";
    if (s.appIcon) {
      const icon = document.createElement("img");
      icon.src = s.appIcon;
      label.append(icon);
    }
    const name = document.createElement("span");
    name.textContent = s.name;
    label.append(name);

    btn.append(thumb, label);
    grid.append(btn);
  }
}

tabs.forEach((t) =>
  t.addEventListener("click", () => {
    tabs.forEach((x) => x.classList.toggle("active", x === t));
    kind = t.dataset.kind;
    render();
  }),
);

document.getElementById("cancel").addEventListener("click", () => window.picker.choose(null));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") window.picker.choose(null);
});

window.picker.sources().then((s) => {
  all = s;
  // Default to whichever tab has content.
  if (!all.some((x) => x.kind === "screen") && all.some((x) => x.kind === "window")) {
    kind = "window";
    tabs.forEach((x) => x.classList.toggle("active", x.dataset.kind === "window"));
  }
  render();
});
