import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

import '../../../widgets/brand_logo.dart';

/// One participant tile: renders their video stream, or an avatar when video is
/// off / not yet flowing. Manages its own [RTCVideoRenderer].
class VideoTile extends StatefulWidget {
  const VideoTile({
    super.key,
    required this.stream,
    required this.name,
    required this.avatarColor,
    this.avatarUrl,
    this.isSelf = false,
    this.mirror = false,
    this.micOff = false,
    this.videoOff = false,
    this.label,
  });

  final MediaStream? stream;
  final String name;
  final String avatarColor;
  final String? avatarUrl;
  final bool isSelf;
  final bool mirror;
  final bool micOff;
  final bool videoOff;
  final String? label;

  @override
  State<VideoTile> createState() => _VideoTileState();
}

class _VideoTileState extends State<VideoTile> {
  final _renderer = RTCVideoRenderer();
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _renderer.initialize().then((_) {
      if (!mounted) return;
      setState(() => _ready = true);
      _attach();
    });
  }

  @override
  void didUpdateWidget(VideoTile old) {
    super.didUpdateWidget(old);
    if (old.stream != widget.stream) _attach();
  }

  void _attach() {
    if (!_ready) return;
    _renderer.srcObject = widget.stream;
  }

  @override
  void dispose() {
    _renderer.srcObject = null;
    _renderer.dispose();
    super.dispose();
  }

  bool get _hasVideo {
    if (widget.videoOff || widget.stream == null) return false;
    final tracks = widget.stream!.getVideoTracks();
    return tracks.isNotEmpty && tracks.first.enabled;
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Container(
        color: const Color(0xFF10231A),
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (_ready && _hasVideo)
              RTCVideoView(
                _renderer,
                mirror: widget.mirror,
                objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
              )
            else
              Center(
                child: BrandAvatar(
                  name: widget.name,
                  colorHex: widget.avatarColor,
                  imageUrl: widget.avatarUrl,
                  size: 64,
                ),
              ),
            Positioned(
              left: 8,
              right: 8,
              bottom: 8,
              child: Row(
                children: [
                  if (widget.micOff)
                    const Padding(
                      padding: EdgeInsets.only(right: 6),
                      child: Icon(Icons.mic_off_rounded,
                          size: 15, color: Color(0xFFFF6B6B)),
                    ),
                  Flexible(
                    child: Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.45),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        widget.label ?? widget.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
