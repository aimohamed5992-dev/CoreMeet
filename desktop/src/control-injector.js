"use strict";

const { codeToKey, hasCode } = require("./keymap");

const BUTTONS = ["LEFT", "MIDDLE", "RIGHT"]; // event.button 0/1/2

/**
 * Turns normalised CoreMeet control events into real OS input via nut.js.
 *
 * Coordinates arrive as 0..1 of the shared frame; we map them onto nut.js's
 * own screen space (the same space `mouse.setPosition` expects), which keeps
 * Retina / scaling consistent. This assumes the participant shared their whole
 * primary screen — sharing a single window or a secondary display will be offset.
 *
 * `dryRun` skips loading the native module and just records what would happen,
 * so the protocol layer can be tested without a desktop session.
 */
class Injector {
  constructor({ dryRun = false } = {}) {
    this.dryRun = dryRun;
    this.paused = false;
    this.log = []; // dry-run record
    this._nut = null;
    this._Button = null;
    this._Point = null;
    this._size = { width: 0, height: 0 };
    this._downButtons = new Set();
    this._downCodes = new Set();
    this._chain = Promise.resolve(); // serialises apply() so events land in order
  }

  async ready() {
    if (this.dryRun) {
      this._size = { width: 1920, height: 1080 };
      return;
    }
    const nut = require("@nut-tree-fork/nut-js");
    this._nut = nut;
    this._Button = nut.Button;
    this._Point = nut.Point;
    nut.mouse.config.autoDelayMs = 0;
    nut.keyboard.config.autoDelayMs = 0;
    await this.refreshScreenSize();
  }

  async refreshScreenSize() {
    if (this.dryRun) return;
    this._size = {
      width: await this._nut.screen.width(),
      height: await this._nut.screen.height(),
    };
  }

  get screenSize() {
    return { ...this._size };
  }

  pause() {
    this.paused = true;
    this.releaseAll().catch(() => {});
  }

  resume() {
    this.paused = false;
  }

  _toPixels(x, y) {
    const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : Number.isFinite(n) ? n : 0);
    return {
      px: Math.round(clamp01(x) * (this._size.width - 1)),
      py: Math.round(clamp01(y) * (this._size.height - 1)),
    };
  }

  /** Release everything we're currently holding down. Safe to call any time. */
  async releaseAll() {
    for (const b of [...this._downButtons]) {
      this._downButtons.delete(b);
      if (!this.dryRun) await this._nut.mouse.releaseButton(this._Button[BUTTONS[b]]);
    }
    for (const code of [...this._downCodes]) {
      this._downCodes.delete(code);
      if (this.dryRun) continue;
      const key = codeToKey(code);
      if (key != null) await this._nut.keyboard.releaseKey(key);
    }
  }

  apply(ev) {
    this._chain = this._chain.then(() => this._apply(ev)).catch(() => {});
    return this._chain;
  }

  /** Resolves when every queued event has been applied. */
  idle() {
    return this._chain;
  }

  async _apply(ev) {
    if (this.paused || !ev || typeof ev.t !== "string") return;
    switch (ev.t) {
      case "move":
        return this._move(ev.x, ev.y);
      case "down":
        return this._button(ev, "down");
      case "up":
        return this._button(ev, "up");
      case "click":
        return this._button(ev, "click");
      case "dblclick":
        return this._button(ev, "dblclick");
      case "wheel":
        return this._wheel(ev);
      case "key":
        return this._key(ev);
      default:
        return; // hello / session / unknown — ignore
    }
  }

  async _move(x, y) {
    const { px, py } = this._toPixels(x, y);
    if (this.dryRun) return void this.log.push({ t: "move", px, py });
    await this._nut.mouse.setPosition(new this._Point(px, py));
  }

  async _button(ev, kind) {
    const idx = ev.button === 1 ? 1 : ev.button === 2 ? 2 : 0;
    if (Number.isFinite(ev.x) && Number.isFinite(ev.y)) await this._move(ev.x, ev.y);
    if (this.dryRun) return void this.log.push({ t: kind, button: idx });
    const btn = this._Button[BUTTONS[idx]];
    if (kind === "down") {
      this._downButtons.add(idx);
      await this._nut.mouse.pressButton(btn);
    } else if (kind === "up") {
      this._downButtons.delete(idx);
      await this._nut.mouse.releaseButton(btn);
    } else if (kind === "click") {
      await this._nut.mouse.click(btn);
    } else if (kind === "dblclick") {
      await this._nut.mouse.doubleClick(btn);
    }
  }

  async _wheel(ev) {
    const steps = (d) => Math.max(1, Math.min(10, Math.round(Math.abs(d) / 40)));
    if (Number.isFinite(ev.x) && Number.isFinite(ev.y)) await this._move(ev.x, ev.y);
    if (this.dryRun) return void this.log.push({ t: "wheel", dx: ev.dx, dy: ev.dy });
    const m = this._nut.mouse;
    if (ev.dy) await (ev.dy > 0 ? m.scrollDown(steps(ev.dy)) : m.scrollUp(steps(ev.dy)));
    if (ev.dx) await (ev.dx > 0 ? m.scrollRight(steps(ev.dx)) : m.scrollLeft(steps(ev.dx)));
  }

  async _key(ev) {
    if (!hasCode(ev.code)) return;

    // Faithful replay: the controller's browser sends a keydown/keyup for every
    // physical key, modifiers included, so pressing exactly those reproduces
    // combos like Ctrl+C without synthesising anything. `ev.mods` is only a
    // recovery hint if a modifier's keydown was dropped.
    if (ev.down) {
      if (this._downCodes.has(ev.code)) return; // ignore auto-repeat
      this._downCodes.add(ev.code);
      if (this.dryRun) return void this.log.push({ t: "keydown", code: ev.code, mods: ev.mods });
      await this._syncMissingModifiers(ev.mods);
      await this._nut.keyboard.pressKey(codeToKey(ev.code));
    } else {
      this._downCodes.delete(ev.code);
      if (this.dryRun) return void this.log.push({ t: "keyup", code: ev.code });
      await this._nut.keyboard.releaseKey(codeToKey(ev.code));
    }
  }

  /** Press any modifier the controller reports held but whose keydown we never saw. */
  async _syncMissingModifiers(mods) {
    if (!mods) return;
    const pairs = [
      [mods.ctrl, "ControlLeft"], [mods.alt, "AltLeft"],
      [mods.shift, "ShiftLeft"], [mods.meta, "MetaLeft"],
    ];
    for (const [held, code] of pairs) {
      const alt = code.replace("Left", "Right");
      if (held && !this._downCodes.has(code) && !this._downCodes.has(alt)) {
        this._downCodes.add(code);
        await this._nut.keyboard.pressKey(codeToKey(code));
      }
    }
  }
}

module.exports = { Injector };
