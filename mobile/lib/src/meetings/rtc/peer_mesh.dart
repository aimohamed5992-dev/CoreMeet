import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

import 'ice_config.dart';
import 'meeting_hub.dart';

typedef RemoteFeedHandler = void Function(
    String connectionId, MediaStream? stream, String? participantId);

class _Peer {
  _Peer(this.pc);
  final RTCPeerConnection pc;
  String? participantId;
  final List<RTCIceCandidate> pendingIce = [];
  bool remoteDescSet = false;
}

/// Full-mesh WebRTC, mirroring the web client: every participant holds one
/// `RTCPeerConnection` to every other. The participant who *joins* sends the
/// offers (learned via `roomPeers`); those already in the room answer.
/// Toggling camera/mic replaces the outgoing track — no renegotiation.
class PeerMesh {
  PeerMesh(this._hub, this._onRemote) {
    _subs.addAll([
      _hub.on('roomPeers', (a) {
        for (final p in _list(a)) {
          _callPeer(p['connectionId'] as String, p['participantId'] as String?);
        }
      }),
      _hub.on('peerJoined', (a) {
        final p = _first(a);
        if (p != null) {
          _ensurePeer(p['connectionId'] as String, p['participantId'] as String?);
        }
      }),
      _hub.on('peerLeft', (a) {
        final p = _first(a);
        if (p != null) _dropPeer(p['connectionId'] as String);
      }),
      _hub.on('offer', (a) => _handleOffer(a?[0] as String, a?[1] as String)),
      _hub.on('answer', (a) => _handleAnswer(a?[0] as String, a?[1] as String)),
      _hub.on('iceCandidate',
          (a) => _handleIce(a?[0] as String, a?[1] as String)),
    ]);
  }

  final MeetingHub _hub;
  final RemoteFeedHandler _onRemote;
  final _peers = <String, _Peer>{};
  final _subs = <void Function()>[];
  MediaStream? _localStream;
  bool _disposed = false;

  void setLocalStream(MediaStream? stream) {
    _localStream = stream;
    for (final p in _peers.values) {
      _syncTracks(p.pc);
    }
  }

  /// Replace the outgoing track of a kind on every peer connection.
  Future<void> replaceOutgoingTrack(String kind, MediaStreamTrack? track) async {
    for (final p in _peers.values) {
      final senders = await p.pc.getSenders();
      RTCRtpSender? sender;
      for (final s in senders) {
        if (s.track?.kind == kind) {
          sender = s;
          break;
        }
      }
      if (sender != null) {
        await sender.replaceTrack(track).catchError((_) {});
      } else if (track != null && _localStream != null) {
        await p.pc.addTrack(track, _localStream!);
      }
    }
  }

  Future<void> dispose() async {
    _disposed = true;
    for (final u in _subs) {
      u();
    }
    for (final id in _peers.keys.toList()) {
      await _dropPeer(id);
    }
  }

  // ---- lifecycle ----

  Future<_Peer> _ensurePeer(String connectionId, String? participantId) async {
    final existing = _peers[connectionId];
    if (existing != null) {
      if (participantId != null) existing.participantId = participantId;
      return existing;
    }

    final pc = await createPeerConnection(rtcConfiguration());
    final peer = _Peer(pc)..participantId = participantId;
    _peers[connectionId] = peer;

    await _syncTracks(pc);

    pc.onIceCandidate = (candidate) {
      if (candidate.candidate == null) return;
      _hub.sendIceCandidate(connectionId, jsonEncode(candidate.toMap()));
    };
    pc.onTrack = (event) {
      final stream = event.streams.isNotEmpty
          ? event.streams.first
          : null;
      if (stream != null) {
        _onRemote(connectionId, stream, peer.participantId);
      }
    };
    pc.onConnectionState = (state) {
      if (state == RTCPeerConnectionState.RTCPeerConnectionStateFailed ||
          state == RTCPeerConnectionState.RTCPeerConnectionStateClosed) {
        _dropPeer(connectionId);
      }
    };

    return peer;
  }

  Future<void> _callPeer(String connectionId, String? participantId) async {
    if (_disposed || connectionId == _hub.connectionId) return;
    final peer = await _ensurePeer(connectionId, participantId);
    try {
      final offer = await peer.pc.createOffer();
      await peer.pc.setLocalDescription(offer);
      _hub.sendOffer(connectionId, _encodeDesc(offer));
    } catch (_) {/* torn down */}
  }

  Future<void> _handleOffer(String from, String sdp) async {
    if (_disposed) return;
    final peer = await _ensurePeer(from, null);
    try {
      await peer.pc.setRemoteDescription(_decodeDesc(sdp));
      peer.remoteDescSet = true;
      await _flushIce(peer);
      final answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);
      _hub.sendAnswer(from, _encodeDesc(answer));
    } catch (e) {
      debugPrint('handleOffer failed: $e');
    }
  }

  Future<void> _handleAnswer(String from, String sdp) async {
    final peer = _peers[from];
    if (peer == null) return;
    try {
      await peer.pc.setRemoteDescription(_decodeDesc(sdp));
      peer.remoteDescSet = true;
      await _flushIce(peer);
    } catch (e) {
      debugPrint('handleAnswer failed: $e');
    }
  }

  Future<void> _handleIce(String from, String candidate) async {
    final peer = _peers[from];
    if (peer == null) return;
    final ice = _decodeIce(candidate);
    if (!peer.remoteDescSet) {
      peer.pendingIce.add(ice);
      return;
    }
    await peer.pc.addCandidate(ice).catchError((_) {});
  }

  Future<void> _flushIce(_Peer peer) async {
    final queued = List<RTCIceCandidate>.from(peer.pendingIce);
    peer.pendingIce.clear();
    for (final c in queued) {
      await peer.pc.addCandidate(c).catchError((_) {});
    }
  }

  Future<void> _dropPeer(String connectionId) async {
    final peer = _peers.remove(connectionId);
    if (peer == null) return;
    peer.pc.onIceCandidate = null;
    peer.pc.onTrack = null;
    peer.pc.onConnectionState = null;
    await peer.pc.close();
    _onRemote(connectionId, null, peer.participantId);
  }

  Future<void> _syncTracks(RTCPeerConnection pc) async {
    final stream = _localStream;
    if (stream == null) return;
    final senders = await pc.getSenders();
    final existing = senders.map((s) => s.track?.id).whereType<String>().toSet();
    for (final track in stream.getTracks()) {
      if (!existing.contains(track.id)) {
        await pc.addTrack(track, stream);
      }
    }
  }

  // ---- (de)serialisation matching the web client ----

  String _encodeDesc(RTCSessionDescription d) =>
      jsonEncode({'type': d.type, 'sdp': d.sdp});

  RTCSessionDescription _decodeDesc(String s) {
    final m = jsonDecode(s) as Map<String, dynamic>;
    return RTCSessionDescription(m['sdp'] as String?, m['type'] as String?);
  }

  RTCIceCandidate _decodeIce(String s) {
    final m = jsonDecode(s) as Map<String, dynamic>;
    return RTCIceCandidate(
      m['candidate'] as String?,
      m['sdpMid'] as String?,
      (m['sdpMLineIndex'] as num?)?.toInt(),
    );
  }

  List<Map<String, dynamic>> _list(List<Object?>? args) {
    final first = args != null && args.isNotEmpty ? args.first : null;
    if (first is! List) return const [];
    return first
        .whereType<Map>()
        .map((e) => e.map((k, v) => MapEntry('$k', v)))
        .toList();
  }

  Map<String, dynamic>? _first(List<Object?>? args) {
    final first = args != null && args.isNotEmpty ? args.first : null;
    if (first is! Map) return null;
    return first.map((k, v) => MapEntry('$k', v));
  }
}
