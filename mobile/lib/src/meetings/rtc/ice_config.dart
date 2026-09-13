import 'dart:convert';

import '../../config/env.dart';

/// Parsed ICE server list for `RTCPeerConnection`, in flutter_webrtc's config
/// shape: `{'iceServers': [{'urls': ..., 'username': ..., 'credential': ...}]}`.
Map<String, dynamic> rtcConfiguration() {
  return {
    'iceServers': _iceServers(),
    'sdpSemantics': 'unified-plan',
  };
}

List<Map<String, dynamic>> _iceServers() {
  const fallback = [
    {'urls': 'stun:stun.l.google.com:19302'}
  ];
  try {
    final parsed = jsonDecode(Env.iceServersJson);
    if (parsed is! List || parsed.isEmpty) return fallback;
    return parsed
        .whereType<Map>()
        .map((e) => e.map((k, v) => MapEntry('$k', v)))
        .toList();
  } catch (_) {
    return fallback;
  }
}
