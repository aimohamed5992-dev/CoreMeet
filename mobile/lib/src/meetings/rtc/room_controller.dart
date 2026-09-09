import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

import '../../auth/auth_controller.dart';
import '../../features/lobby/lobby_controller.dart';
import '../meetings_repository.dart';
import '../models/chat_message.dart';
import '../models/meeting.dart';
import 'control_event.dart';
import 'meeting_hub.dart';
import 'meeting_media.dart';
import 'peer_mesh.dart';

enum RoomPhase { connecting, connected, reconnecting, disconnected, error }

enum ControlRequestState { idle, requesting, denied }

@immutable
class PeerRef {
  const PeerRef(this.connectionId, this.name);
  final String connectionId;
  final String name;
}

@immutable
class ControlState {
  const ControlState({
    this.incomingRequest,
    this.controlledBy,
    this.controlling,
    this.requestState = ControlRequestState.idle,
    this.deniedReason,
    this.sessions = const {},
  });

  /// Someone asked to control my shared screen (I must consent).
  final PeerRef? incomingRequest;

  /// Someone is actively driving my screen.
  final PeerRef? controlledBy;

  /// I am actively driving someone else's shared screen.
  final PeerRef? controlling;

  final ControlRequestState requestState;
  final String? deniedReason; // not_sharing | busy | denied

  /// Room-wide active sessions: targetConnectionId -> controller name.
  final Map<String, String> sessions;

  ControlState copyWith({
    Object? incomingRequest = _sentinel,
    Object? controlledBy = _sentinel,
    Object? controlling = _sentinel,
    ControlRequestState? requestState,
    Object? deniedReason = _sentinel,
    Map<String, String>? sessions,
  }) {
    return ControlState(
      incomingRequest: incomingRequest == _sentinel
          ? this.incomingRequest
          : incomingRequest as PeerRef?,
      controlledBy:
          controlledBy == _sentinel ? this.controlledBy : controlledBy as PeerRef?,
      controlling:
          controlling == _sentinel ? this.controlling : controlling as PeerRef?,
      requestState: requestState ?? this.requestState,
      deniedReason:
          deniedReason == _sentinel ? this.deniedReason : deniedReason as String?,
      sessions: sessions ?? this.sessions,
    );
  }

  static const _sentinel = Object();
}

@immutable
class RemoteFeed {
  const RemoteFeed({required this.stream, this.participantId});
  final MediaStream stream;
  final String? participantId;
}

@immutable
class RemoteMediaState {
  const RemoteMediaState({this.audio = true, this.video = true, this.screen = false});
  final bool audio;
  final bool video;
  final bool screen;
}

@immutable
class RoomState {
  const RoomState({
    this.phase = RoomPhase.connecting,
    this.error,
    this.meeting,
    this.me,
    this.participants = const [],
    this.localStream,
    this.micOn = true,
    this.camOn = true,
    this.frontCamera = true,
    this.mediaDenied = false,
    this.remoteFeeds = const {},
    this.remoteMedia = const {},
    this.messages = const [],
    this.unread = 0,
    this.control = const ControlState(),
    this.selfConnectionId,
  });

  final RoomPhase phase;
  final String? error;
  final MeetingDetail? meeting;
  final Participant? me;
  final List<Participant> participants;
  final MediaStream? localStream;
  final bool micOn;
  final bool camOn;
  final bool frontCamera;
  final bool mediaDenied;
  final Map<String, RemoteFeed> remoteFeeds; // by connectionId
  final Map<String, RemoteMediaState> remoteMedia; // by connectionId
  final List<ChatMessage> messages;
  final int unread;
  final ControlState control;
  final String? selfConnectionId;

  int get connectedCount =>
      participants.where((p) => p.isConnected).length.clamp(1, 999);

  bool get isHost =>
      meeting != null && me != null && meeting!.hostId == me!.userId;

  RoomState copyWith({
    RoomPhase? phase,
    String? error,
    MeetingDetail? meeting,
    Participant? me,
    List<Participant>? participants,
    MediaStream? localStream,
    bool? micOn,
    bool? camOn,
    bool? frontCamera,
    bool? mediaDenied,
    Map<String, RemoteFeed>? remoteFeeds,
    Map<String, RemoteMediaState>? remoteMedia,
    List<ChatMessage>? messages,
    int? unread,
    ControlState? control,
    String? selfConnectionId,
  }) {
    return RoomState(
      phase: phase ?? this.phase,
      error: error,
      meeting: meeting ?? this.meeting,
      me: me ?? this.me,
      participants: participants ?? this.participants,
      localStream: localStream ?? this.localStream,
      micOn: micOn ?? this.micOn,
      camOn: camOn ?? this.camOn,
      frontCamera: frontCamera ?? this.frontCamera,
      mediaDenied: mediaDenied ?? this.mediaDenied,
      remoteFeeds: remoteFeeds ?? this.remoteFeeds,
      remoteMedia: remoteMedia ?? this.remoteMedia,
      messages: messages ?? this.messages,
      unread: unread ?? this.unread,
      control: control ?? this.control,
      selfConnectionId: selfConnectionId ?? this.selfConnectionId,
    );
  }
}

class RoomController extends StateNotifier<RoomState> {
  RoomController(this._ref, this.code) : super(const RoomState()) {
    final prefs = _ref.read(lobbyPrefsProvider);
    state = state.copyWith(micOn: prefs.micOn, camOn: prefs.cameraOn);
    _start();
  }

  final Ref _ref;
  final String code;

  final _media = MeetingMedia();
  MeetingHub? _hub;
  PeerMesh? _mesh;
  bool _disposed = false;

  // last broadcast media state, resent to newcomers
  bool _mAudio = true, _mVideo = true;
  final bool _mScreen = false; // screen share is step 9

  Future<void> _start() async {
    final micOn = state.micOn;
    final camOn = state.camOn;
    try {
      // 1. Local media (best-effort; the room still works audio/chat-only).
      _media.audioOn = micOn;
      _media.videoOn = camOn;
      await _media.start();
      _media.stream?.getAudioTracks().forEach((t) => t.enabled = micOn);
      _media.stream?.getVideoTracks().forEach((t) => t.enabled = camOn);
      _mAudio = micOn;
      _mVideo = camOn;
      if (_disposed) return;
      state = state.copyWith(
        localStream: _media.stream,
        mediaDenied: _media.denied,
      );

      // 2. Join over REST (idempotent — returns the existing participant).
      final repo = _ref.read(meetingsRepositoryProvider);
      final joined = await repo.join(code);
      if (_disposed) return;
      state = state.copyWith(
        meeting: joined.meeting,
        me: joined.me,
        participants: joined.meeting.participants,
      );

      // 3. Hub + mesh.
      final hub = MeetingHub(_ref.read(authControllerProvider.notifier));
      _hub = hub;

      hub.on('roomPeers', (a) => _onRoomPeers(a));
      hub.on('peerJoined', (a) => _onPeerJoined(a));
      hub.on('peerLeft', (a) => _onPeerLeft(a));
      hub.on('peerMediaState', (a) => _onPeerMediaState(a));
      hub.on('chatMessage', (a) => _onChatMessage(a));
      hub.on('error', (a) {
        final msg = a != null && a.isNotEmpty ? '${a.first}' : null;
        state = state.copyWith(phase: RoomPhase.error, error: msg);
      });
      _wireControlHandlers(hub);

      final mesh = PeerMesh(hub, _onRemoteFeed);
      _mesh = mesh;
      mesh.setLocalStream(_media.stream);
      _media.onOutgoingTrackChanged = mesh.replaceOutgoingTrack;

      await hub.start();
      if (_disposed) {
        await hub.stop();
        return;
      }
      hub.onReconnecting(() {
        if (!_disposed) state = state.copyWith(phase: RoomPhase.reconnecting);
      });
      hub.onReconnected(() async {
        if (_disposed) return;
        state = state.copyWith(phase: RoomPhase.connected);
        await hub.joinRoom(code, joined.me.id);
        _announce();
      });
      hub.onClose(() {
        if (!_disposed) state = state.copyWith(phase: RoomPhase.disconnected);
      });

      await hub.joinRoom(code, joined.me.id);
      if (_disposed) return;
      _setConnected(joined.me.id, true);
      state = state.copyWith(
        phase: RoomPhase.connected,
        selfConnectionId: hub.connectionId,
      );
      _announce();
    } catch (e) {
      debugPrint('room start failed: $e');
      if (!_disposed) {
        state = state.copyWith(phase: RoomPhase.error, error: e.toString());
      }
    }
  }

  void _announce() {
    _hub?.setMediaState(_mAudio, _mVideo, _mScreen);
  }

  // ---- roster ----

  void _upsert(Participant p) {
    final list = [...state.participants];
    final i = list.indexWhere((x) => x.id == p.id);
    if (i == -1) {
      list.add(p);
    } else {
      list[i] = p;
    }
    state = state.copyWith(participants: list);
  }

  void _setConnected(String participantId, bool connected) {
    final list = [
      for (final p in state.participants)
        p.id == participantId ? p.copyWith(isConnected: connected) : p,
    ];
    state = state.copyWith(participants: list);
  }

  void _onRoomPeers(List<Object?>? a) {
    final peers = _mapList(a);
    for (final p in peers) {
      _upsert(_participantFromPeer(p, connected: true));
    }
  }

  void _onPeerJoined(List<Object?>? a) {
    final p = _map(a);
    if (p == null) return;
    _upsert(_participantFromPeer(p, connected: true));
    _announce(); // let the newcomer's tiles reflect our mic/cam state
  }

  void _onPeerLeft(List<Object?>? a) {
    final p = _map(a);
    if (p == null) return;
    final pid = p['participantId'] as String?;
    final cid = p['connectionId'] as String?;
    if (pid != null) _setConnected(pid, false);
    if (cid != null) {
      final feeds = {...state.remoteFeeds}..remove(cid);
      final media = {...state.remoteMedia}..remove(cid);
      state = state.copyWith(remoteFeeds: feeds, remoteMedia: media);
    }
  }

  void _onPeerMediaState(List<Object?>? a) {
    final s = _map(a);
    if (s == null) return;
    final cid = s['connectionId'] as String?;
    if (cid == null) return;
    final media = {...state.remoteMedia};
    media[cid] = RemoteMediaState(
      audio: s['audio'] as bool? ?? true,
      video: s['video'] as bool? ?? true,
      screen: s['screen'] as bool? ?? false,
    );
    state = state.copyWith(remoteMedia: media);
  }

  void _onRemoteFeed(String connectionId, MediaStream? stream, String? participantId) {
    final feeds = {...state.remoteFeeds};
    if (stream == null) {
      feeds.remove(connectionId);
    } else {
      feeds[connectionId] =
          RemoteFeed(stream: stream, participantId: participantId);
    }
    state = state.copyWith(remoteFeeds: feeds);
  }

  Participant _participantFromPeer(Map<String, dynamic> p, {required bool connected}) {
    return Participant(
      id: p['participantId'] as String,
      userId: null,
      displayName: p['displayName'] as String? ?? 'Guest',
      role: ParticipantRole.guest,
      avatarColor: p['avatarColor'] as String? ?? '#667A6F',
      avatarUrl: (p['avatarUrl'] as String?)?.isNotEmpty == true
          ? p['avatarUrl'] as String?
          : null,
      isConnected: connected,
    );
  }

  // ---- user actions ----

  void toggleMic() {
    _media.toggleAudio();
    _mAudio = _media.audioOn;
    state = state.copyWith(micOn: _media.audioOn);
    _announce();
  }

  void toggleCamera() {
    _media.toggleVideo();
    _mVideo = _media.videoOn;
    state = state.copyWith(camOn: _media.videoOn);
    _announce();
  }

  Future<void> switchCamera() async {
    await _media.switchCamera();
    state = state.copyWith(frontCamera: _media.frontCamera);
  }

  Future<void> leave() async {
    await _hub?.leaveRoom();
  }

  /// Host only — ends the meeting for everyone over REST.
  Future<void> endMeeting() async {
    await _ref.read(meetingsRepositoryProvider).end(code);
  }

  // ---- chat ----

  void _onChatMessage(List<Object?>? a) {
    final m = _map(a);
    if (m == null) return;
    final msg = ChatMessage.fromJson(m);
    if (state.messages.any((x) => x.id == msg.id)) return;
    final mine = msg.senderParticipantId == state.me?.id;
    state = state.copyWith(
      messages: [...state.messages, msg],
      unread: mine ? state.unread : state.unread + 1,
    );
  }

  void sendChat(String text) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;
    _hub?.sendChatMessage(trimmed);
  }

  void markChatRead() {
    if (state.unread != 0) state = state.copyWith(unread: 0);
  }

  // ---- remote screen control ----

  ControlEventSink? _controlSink;
  String? _pendingRequester;

  /// The target subscribes here to receive relayed control events for injection.
  set onControlEvent(ControlEventSink? cb) => _controlSink = cb;

  void _wireControlHandlers(MeetingHub hub) {
    hub.on('controlRequested', (a) {
      final r = _map(a);
      if (r == null) return;
      _pendingRequester = r['connectionId'] as String?;
      _control = _control.copyWith(
        incomingRequest: PeerRef(
            r['connectionId'] as String? ?? '', r['name'] as String? ?? 'Someone'),
      );
    });
    hub.on('controlDenied', (a) {
      final reason = a != null && a.length > 1 ? '${a[1]}' : 'denied';
      _control = _control.copyWith(
        requestState: ControlRequestState.denied,
        deniedReason: reason,
        controlling: null,
      );
    });
    hub.on('controlResponse', (a) {
      final byConn = a != null && a.isNotEmpty ? '${a.first}' : '';
      final granted = a != null && a.length > 1 && a[1] == true;
      if (granted) {
        _control = _control.copyWith(
          requestState: ControlRequestState.idle,
          controlling: _control.controlling ?? PeerRef(byConn, ''),
        );
      } else {
        _control = _control.copyWith(
          requestState: ControlRequestState.denied,
          deniedReason: 'denied',
          controlling: null,
        );
      }
    });
    hub.on('controlGranted', (a) {
      final controllerConn = a != null && a.isNotEmpty ? '${a.first}' : '';
      final name = a != null && a.length > 1 ? '${a[1]}' : 'Someone';
      _control = _control.copyWith(
        controlledBy: PeerRef(controllerConn, name),
        incomingRequest: null,
      );
      _pendingRequester = null;
    });
    hub.on('controlEnded', (_) {
      _control = _control.copyWith(
        controlledBy: null,
        controlling: null,
        incomingRequest: null,
        requestState: ControlRequestState.idle,
      );
      _pendingRequester = null;
    });
    hub.on('controlEvent', (a) {
      final json = a != null && a.isNotEmpty ? '${a.first}' : null;
      if (json != null) _controlSink?.call(json);
    });
    hub.on('controlSessions', (a) {
      final list = _mapList(a);
      _control = _control.copyWith(sessions: {
        for (final s in list)
          '${s['targetConnectionId']}': '${s['controllerName']}',
      });
    });
    hub.on('controlStarted', (a) {
      final s = _map(a);
      if (s == null) return;
      _control = _control.copyWith(sessions: {
        ...state.control.sessions,
        '${s['targetConnectionId']}': '${s['controllerName']}',
      });
    });
    hub.on('controlStopped', (a) {
      final s = _map(a);
      if (s == null) return;
      final next = {...state.control.sessions}..remove('${s['targetConnectionId']}');
      _control = _control.copyWith(sessions: next);
    });
  }

  ControlState get _control => state.control;
  set _control(ControlState c) => state = state.copyWith(control: c);

  /// I want to drive [targetConnectionId]'s shared screen.
  void requestControl(String targetConnectionId) {
    _control = _control.copyWith(
      requestState: ControlRequestState.requesting,
      deniedReason: null,
      controlling: PeerRef(targetConnectionId, ''),
    );
    _hub?.requestControl(targetConnectionId);
  }

  /// I'm sharing my screen and respond to a pending request.
  void respondControl(bool granted) {
    final requester = _pendingRequester;
    if (requester != null) _hub?.respondControl(requester, granted);
    if (!granted) {
      _control = _control.copyWith(incomingRequest: null);
      _pendingRequester = null;
    }
  }

  void sendControlEvent(ControlEvent event) => _hub?.sendControlEvent(event.encode());

  void stopControl() {
    _hub?.revokeControl();
    _control = _control.copyWith(
      controlledBy: null,
      controlling: null,
      requestState: ControlRequestState.idle,
    );
  }

  @override
  void dispose() {
    _disposed = true;
    _mesh?.dispose();
    _hub?.leaveRoom().whenComplete(() => _hub?.stop());
    _media.dispose();
    super.dispose();
  }

  // ---- arg parsing helpers ----

  List<Map<String, dynamic>> _mapList(List<Object?>? a) {
    final first = a != null && a.isNotEmpty ? a.first : null;
    if (first is! List) return const [];
    return first
        .whereType<Map>()
        .map((e) => e.map((k, v) => MapEntry('$k', v)))
        .toList();
  }

  Map<String, dynamic>? _map(List<Object?>? a) {
    final first = a != null && a.isNotEmpty ? a.first : null;
    if (first is! Map) return null;
    return first.map((k, v) => MapEntry('$k', v));
  }
}

final roomControllerProvider = StateNotifierProvider.autoDispose
    .family<RoomController, RoomState, String>(
  (ref, code) => RoomController(ref, code),
);
