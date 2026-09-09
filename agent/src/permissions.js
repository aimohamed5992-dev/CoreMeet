"use strict";

const { systemPreferences, shell } = require("electron");

/**
 * On macOS, injecting input requires the app to be granted Accessibility
 * access in System Settings → Privacy & Security → Accessibility.
 * Windows and Linux (X11) need no explicit grant.
 */
function accessibilityGranted() {
  if (process.platform !== "darwin") return true;
  return systemPreferences.isTrustedAccessibilityClient(false);
}

/** Trigger the macOS prompt and open the settings pane. */
function requestAccessibility() {
  if (process.platform !== "darwin") return;
  systemPreferences.isTrustedAccessibilityClient(true);
  shell.openExternal(
    "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
  );
}

module.exports = { accessibilityGranted, requestAccessibility };
