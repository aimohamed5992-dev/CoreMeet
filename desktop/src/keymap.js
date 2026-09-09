"use strict";

/**
 * Map a browser `KeyboardEvent.code` (layout-independent physical key) to a
 * nut.js `Key`. The nut.js enum is loaded lazily so this module — and the
 * protocol/injector code that requires it — can run in dry-run without the
 * native module present.
 */
let CODE_TO_KEY = null;

function build() {
  const { Key } = require("@nut-tree-fork/nut-js");
  const map = {
    ...Object.fromEntries("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => [`Key${c}`, Key[c]])),
    Digit0: Key.Num0, Digit1: Key.Num1, Digit2: Key.Num2, Digit3: Key.Num3, Digit4: Key.Num4,
    Digit5: Key.Num5, Digit6: Key.Num6, Digit7: Key.Num7, Digit8: Key.Num8, Digit9: Key.Num9,
    ...Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`F${i + 1}`, Key[`F${i + 1}`]])),
    Space: Key.Space, Enter: Key.Enter, NumpadEnter: Key.Enter, Tab: Key.Tab,
    Backspace: Key.Backspace, Delete: Key.Delete, Escape: Key.Escape, CapsLock: Key.CapsLock,
    ArrowUp: Key.Up, ArrowDown: Key.Down, ArrowLeft: Key.Left, ArrowRight: Key.Right,
    Home: Key.Home, End: Key.End, PageUp: Key.PageUp, PageDown: Key.PageDown, Insert: Key.Insert,
    Minus: Key.Minus, Equal: Key.Equal, BracketLeft: Key.LeftBracket, BracketRight: Key.RightBracket,
    Backslash: Key.Backslash, Semicolon: Key.Semicolon, Quote: Key.Quote, Backquote: Key.Grave,
    Comma: Key.Comma, Period: Key.Period, Slash: Key.Slash,
    ShiftLeft: Key.LeftShift, ShiftRight: Key.RightShift,
    ControlLeft: Key.LeftControl, ControlRight: Key.RightControl,
    AltLeft: Key.LeftAlt, AltRight: Key.RightAlt,
    MetaLeft: Key.LeftSuper, MetaRight: Key.RightSuper,
    Numpad0: Key.NumPad0, Numpad1: Key.NumPad1, Numpad2: Key.NumPad2, Numpad3: Key.NumPad3,
    Numpad4: Key.NumPad4, Numpad5: Key.NumPad5, Numpad6: Key.NumPad6, Numpad7: Key.NumPad7,
    Numpad8: Key.NumPad8, Numpad9: Key.NumPad9,
    NumpadAdd: Key.Add, NumpadSubtract: Key.Subtract, NumpadMultiply: Key.Multiply,
    NumpadDivide: Key.Divide, NumpadDecimal: Key.Decimal, NumLock: Key.NumLock,
  };
  return map;
}

function codeToKey(code) {
  if (!CODE_TO_KEY) CODE_TO_KEY = build();
  return Object.prototype.hasOwnProperty.call(CODE_TO_KEY, code) ? CODE_TO_KEY[code] : null;
}

const MODIFIER_CODES = new Set([
  "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight",
  "AltLeft", "AltRight", "MetaLeft", "MetaRight",
]);

/** Whether we have a mapping for this code (no native module needed). */
const KNOWN_CODES = new Set([
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => `Key${c}`),
  ...Array.from({ length: 10 }, (_, i) => `Digit${i}`),
  ...Array.from({ length: 24 }, (_, i) => `F${i + 1}`),
  "Space", "Enter", "NumpadEnter", "Tab", "Backspace", "Delete", "Escape", "CapsLock",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown", "Insert",
  "Minus", "Equal", "BracketLeft", "BracketRight", "Backslash", "Semicolon", "Quote", "Backquote",
  "Comma", "Period", "Slash",
  "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight",
  ...Array.from({ length: 10 }, (_, i) => `Numpad${i}`),
  "NumpadAdd", "NumpadSubtract", "NumpadMultiply", "NumpadDivide", "NumpadDecimal", "NumLock",
]);

function hasCode(code) {
  return KNOWN_CODES.has(code);
}

module.exports = { codeToKey, hasCode, MODIFIER_CODES };
