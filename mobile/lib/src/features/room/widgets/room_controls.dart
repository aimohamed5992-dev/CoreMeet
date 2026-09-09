import 'package:flutter/material.dart';

import '../../../localization/l10n_ext.dart';

class RoomControls extends StatelessWidget {
  const RoomControls({
    super.key,
    required this.micOn,
    required this.camOn,
    required this.onToggleMic,
    required this.onToggleCam,
    required this.onFlip,
    required this.onLeave,
    required this.onPeople,
    required this.onChat,
    this.peopleCount = 1,
    this.unread = 0,
  });

  final bool micOn;
  final bool camOn;
  final VoidCallback onToggleMic;
  final VoidCallback onToggleCam;
  final VoidCallback onFlip;
  final VoidCallback onLeave;
  final VoidCallback onPeople;
  final VoidCallback onChat;
  final int peopleCount;
  final int unread;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Container(
      padding: EdgeInsets.fromLTRB(
          16, 12, 16, 12 + MediaQuery.of(context).padding.bottom),
      color: const Color(0xFF0B130E),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _CircleButton(
            icon: micOn ? Icons.mic_rounded : Icons.mic_off_rounded,
            active: micOn,
            tooltip: l10n.roomMicTitle,
            onTap: onToggleMic,
          ),
          _CircleButton(
            icon: camOn ? Icons.videocam_rounded : Icons.videocam_off_rounded,
            active: camOn,
            tooltip: l10n.roomCamTitle,
            onTap: onToggleCam,
          ),
          _CircleButton(
            icon: Icons.cameraswitch_rounded,
            active: true,
            tooltip: l10n.roomFlipTitle,
            onTap: onFlip,
          ),
          _Badged(
            count: unread,
            color: const Color(0xFFD64545),
            child: _CircleButton(
              icon: Icons.chat_bubble_rounded,
              active: true,
              tooltip: l10n.chatTitle,
              onTap: onChat,
            ),
          ),
          _Badged(
            count: peopleCount,
            color: const Color(0xFF1FA84C),
            child: _CircleButton(
              icon: Icons.people_alt_rounded,
              active: true,
              tooltip: l10n.roomPeopleTitle,
              onTap: onPeople,
            ),
          ),
          _CircleButton(
            icon: Icons.call_end_rounded,
            active: true,
            danger: true,
            tooltip: l10n.roomLeaveTitle,
            onTap: onLeave,
          ),
        ],
      ),
    );
  }
}

class _Badged extends StatelessWidget {
  const _Badged({required this.child, required this.count, required this.color});
  final Widget child;
  final int count;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        child,
        if (count > 0)
          Positioned(
            right: -2,
            top: -2,
            child: Container(
              padding: const EdgeInsets.all(4),
              constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
              alignment: Alignment.center,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              child: Text('${count > 99 ? '99+' : count}',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w700)),
            ),
          ),
      ],
    );
  }
}

class _CircleButton extends StatelessWidget {
  const _CircleButton({
    required this.icon,
    required this.active,
    required this.onTap,
    required this.tooltip,
    this.danger = false,
  });

  final IconData icon;
  final bool active;
  final bool danger;
  final VoidCallback onTap;
  final String tooltip;

  @override
  Widget build(BuildContext context) {
    final bg = danger
        ? const Color(0xFFD64545)
        : active
            ? Colors.white.withValues(alpha: 0.14)
            : const Color(0xFFD64545);
    return Tooltip(
      message: tooltip,
      child: InkResponse(
        onTap: onTap,
        radius: 34,
        child: Container(
          width: danger ? 62 : 52,
          height: 52,
          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(26)),
          child: Icon(icon, color: Colors.white, size: 24),
        ),
      ),
    );
  }
}
