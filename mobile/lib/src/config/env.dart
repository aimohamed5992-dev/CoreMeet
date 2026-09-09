/// Build-time configuration. Override per environment with, e.g.:
///   flutter run --dart-define=COREMEET_API_BASE=http://10.0.2.2:5099
///
/// The default points at the hosted API so a release build works with no flags.
class Env {
  const Env._();

  static const String apiBase = String.fromEnvironment(
    'COREMEET_API_BASE',
    defaultValue: 'https://coremeetapis.urapp4u.com',
  );

  /// SignalR meeting hub (used from step 8 onward).
  static const String hubUrl = String.fromEnvironment(
    'COREMEET_HUB_URL',
    defaultValue: 'https://coremeetapis.urapp4u.com/hubs/meeting',
  );

  static const String webOrigin = String.fromEnvironment(
    'COREMEET_WEB_ORIGIN',
    defaultValue: 'https://coremeet.urapp4u.com',
  );

  /// ICE servers for WebRTC, as a JSON array of `{urls, username?, credential?}`.
  /// STUN-only by default (works on most networks). For reliable connectivity on
  /// carrier-grade NAT / restrictive networks, pass a TURN server — same as the
  /// web client's `VITE_ICE_SERVERS`:
  ///
  ///   flutter build apk --release \
  ///     --dart-define=COREMEET_ICE_SERVERS='[{"urls":"stun:stun.l.google.com:19302"},
  ///       {"urls":["turn:YOUR_HOST:3478?transport=udp"],"username":"...","credential":"..."}]'
  static const String iceServersJson = String.fromEnvironment(
    'COREMEET_ICE_SERVERS',
    defaultValue: '[{"urls":"stun:stun.l.google.com:19302"}]',
  );
}
