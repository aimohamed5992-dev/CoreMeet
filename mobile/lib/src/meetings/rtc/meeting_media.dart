import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

/// Owns the local camera + mic stream for a meeting: the permission prompt,
/// mute toggles, and front/back camera switching.
class MeetingMedia {
  MediaStream? stream;
  bool ready = false;
  bool audioOn = true;
  bool videoOn = true;
  bool denied = false;
  bool frontCamera = true;

  /// Called when the outgoing video track should change on the mesh
  /// (camera toggled off → null; toggled on → the track).
  void Function(String kind, MediaStreamTrack? track)? onOutgoingTrackChanged;

  MediaStreamTrack? get _videoTrack =>
      stream?.getVideoTracks().isNotEmpty == true
          ? stream!.getVideoTracks().first
          : null;
  MediaStreamTrack? get _audioTrack =>
      stream?.getAudioTracks().isNotEmpty == true
          ? stream!.getAudioTracks().first
          : null;

  static const _audioConstraints = {
    'echoCancellation': true,
    'noiseSuppression': true,
    'autoGainControl': true,
  };

  Future<void> start() async {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        'audio': _audioConstraints,
        'video': {
          'facingMode': 'user',
          'width': {'ideal': 1280},
          'height': {'ideal': 720},
          'frameRate': {'ideal': 30},
        },
      });
      ready = true;
      return;
    } catch (e) {
      debugPrint('getUserMedia (a/v) failed: $e');
    }
    // Fall back to audio-only (e.g. no camera on the iOS simulator).
    try {
      stream = await navigator.mediaDevices
          .getUserMedia({'audio': _audioConstraints, 'video': false});
      videoOn = false;
      ready = true;
    } catch (e) {
      debugPrint('getUserMedia (audio) failed: $e');
      denied = true;
      ready = true;
    }
  }

  void toggleAudio() {
    audioOn = !audioOn;
    _audioTrack?.enabled = audioOn;
  }

  void toggleVideo() {
    videoOn = !videoOn;
    final track = _videoTrack;
    track?.enabled = videoOn;
    // Stop sending video entirely when off (saves bandwidth); resume on.
    onOutgoingTrackChanged?.call('video', videoOn ? track : null);
  }

  Future<void> switchCamera() async {
    final track = _videoTrack;
    if (track == null) return;
    try {
      await Helper.switchCamera(track);
      frontCamera = !frontCamera;
    } catch (e) {
      debugPrint('switchCamera failed: $e');
    }
  }

  Future<void> dispose() async {
    for (final t in stream?.getTracks() ?? const <MediaStreamTrack>[]) {
      await t.stop();
    }
    await stream?.dispose();
    stream = null;
  }
}
