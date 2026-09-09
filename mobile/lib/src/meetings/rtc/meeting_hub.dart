import 'package:signalr_netcore/signalr_client.dart';

import '../../auth/auth_controller.dart';
import '../../config/env.dart';

typedef HubHandler = void Function(List<Object?>? args);

/// Thin wrapper around the SignalR `MeetingHub`. Mirrors the web client:
/// presence + chat drive the roster; the offer/answer/iceCandidate relay drives
/// the WebRTC mesh; the control.* events drive remote screen control (step 9).
class MeetingHub {
  MeetingHub(this._auth);

  final AuthController _auth;
  HubConnection? _conn;
  final _handlers = <String, List<HubHandler>>{};

  String? get connectionId => _conn?.connectionId;
  HubConnectionState? get state => _conn?.state;
  bool get isConnected => _conn?.state == HubConnectionState.Connected;

  /// Register a handler for a server event. Returns an unsubscribe.
  void Function() on(String event, HubHandler handler) {
    (_handlers[event] ??= []).add(handler);
    _conn?.on(event, handler);
    return () {
      _handlers[event]?.remove(handler);
      _conn?.off(event, method: handler);
    };
  }

  void onReconnected(void Function() cb) =>
      _conn?.onreconnected(({connectionId}) => cb());
  void onReconnecting(void Function() cb) =>
      _conn?.onreconnecting(({error}) => cb());
  void onClose(void Function() cb) => _conn?.onclose(({error}) => cb());

  Future<void> start() async {
    final conn = HubConnectionBuilder()
        .withUrl(
          Env.hubUrl,
          options: HttpConnectionOptions(
            accessTokenFactory: () async => _auth.accessToken ?? '',
          ),
        )
        .withAutomaticReconnect(
            retryDelays: [0, 2000, 5000, 10000, 15000, 30000])
        .build();
    _conn = conn;
    // Re-attach any handlers registered before start().
    _handlers.forEach((event, list) {
      for (final h in list) {
        conn.on(event, h);
      }
    });
    await conn.start();
  }

  Future<void> stop() async {
    await _conn?.stop();
    _conn = null;
  }

  // ---- presence / chat ----
  Future<void> joinRoom(String code, String participantId) =>
      _invoke('JoinRoom', [code, participantId]);
  Future<void> leaveRoom() => _invoke('LeaveRoom', []);
  Future<void> sendChatMessage(String content) =>
      _invoke('SendChatMessage', [content]);
  Future<void> setMediaState(bool audio, bool video, bool screen) =>
      _invoke('SetMediaState', [audio, video, screen]);

  // ---- WebRTC signaling ----
  Future<void> sendOffer(String target, String sdp) =>
      _invoke('SendOffer', [target, sdp]);
  Future<void> sendAnswer(String target, String sdp) =>
      _invoke('SendAnswer', [target, sdp]);
  Future<void> sendIceCandidate(String target, String candidate) =>
      _invoke('SendIceCandidate', [target, candidate]);

  // ---- remote screen control (step 9) ----
  Future<void> requestControl(String target) =>
      _invoke('RequestControl', [target]);
  Future<void> respondControl(String requester, bool granted) =>
      _invoke('RespondControl', [requester, granted]);
  Future<void> sendControlEvent(String json) =>
      _invoke('SendControlEvent', [json]);
  Future<void> revokeControl() => _invoke('RevokeControl', []);

  Future<void> _invoke(String method, List<Object> args) async {
    final conn = _conn;
    if (conn == null || conn.state != HubConnectionState.Connected) return;
    try {
      await conn.invoke(method, args: args);
    } catch (_) {
      // A dropped invocation during reconnect is not fatal.
    }
  }
}
