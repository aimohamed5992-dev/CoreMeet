import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../localization/l10n_ext.dart';
import '../../meetings/meetings_repository.dart';
import '../../meetings/models/meeting.dart';
import '../../meetings/rtc/room_controller.dart';
import '../../router/app_router.dart';
import '../../widgets/brand_logo.dart';
import 'widgets/chat_sheet.dart';
import 'widgets/control_overlay.dart';
import 'widgets/room_controls.dart';
import 'widgets/video_tile.dart';

class RoomScreen extends ConsumerStatefulWidget {
  const RoomScreen({super.key, required this.code});
  final String code;

  @override
  ConsumerState<RoomScreen> createState() => _RoomScreenState();
}

class _RoomScreenState extends ConsumerState<RoomScreen> {
  bool _leaving = false;

  Future<bool> _confirmLeave() async {
    final l10n = context.l10n;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.roomLeaveConfirmTitle),
        content: Text(l10n.roomLeaveConfirmBody),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l10n.roomStay),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
                backgroundColor: Theme.of(ctx).colorScheme.error),
            child: Text(l10n.roomLeave),
          ),
        ],
      ),
    );
    return ok ?? false;
  }

  Future<void> _leave() async {
    if (_leaving) return;
    if (!await _confirmLeave()) return;
    setState(() => _leaving = true);
    await ref.read(roomControllerProvider(widget.code).notifier).leave();
    ref.invalidate(myMeetingsProvider);
    if (mounted) {
      context.canPop() ? context.pop() : context.go(Routes.dashboard);
    }
  }

  void _showPeople(RoomState room) {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (_) => _PeopleSheet(
        participants: room.participants,
        hostUserId: room.meeting?.hostId,
        isHost: room.isHost,
        onEndMeeting: _endMeeting,
      ),
    );
  }

  void _showChat() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => ChatSheet(code: widget.code),
    );
  }

  Future<void> _endMeeting() async {
    final l10n = context.l10n;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.roomEndConfirmTitle),
        content: Text(l10n.roomEndConfirmBody),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(l10n.roomStay)),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
                backgroundColor: Theme.of(ctx).colorScheme.error),
            child: Text(l10n.roomEnd),
          ),
        ],
      ),
    );
    if (ok != true) return;
    await ref.read(roomControllerProvider(widget.code).notifier).endMeeting();
    ref.invalidate(myMeetingsProvider);
    if (mounted) {
      context.canPop() ? context.pop() : context.go(Routes.dashboard);
    }
  }

  Future<void> _onControlRequest(PeerRef requester) async {
    final l10n = context.l10n;
    final ok = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.ctlRequestTitle),
        content: Text(l10n.ctlRequestBody(requester.name)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(l10n.ctlDeny)),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(l10n.ctlAllow)),
        ],
      ),
    );
    ref
        .read(roomControllerProvider(widget.code).notifier)
        .respondControl(ok == true);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final room = ref.watch(roomControllerProvider(widget.code));
    final ctl = ref.read(roomControllerProvider(widget.code).notifier);
    final user = ref.watch(authControllerProvider).user;

    // Incoming control-of-my-screen request → consent dialog.
    ref.listen(
      roomControllerProvider(widget.code).select((s) => s.control.incomingRequest),
      (prev, next) {
        if (next != null && prev == null) _onControlRequest(next);
      },
    );
    // Denied feedback.
    ref.listen(
      roomControllerProvider(widget.code)
          .select((s) => s.control.requestState == ControlRequestState.denied),
      (prev, denied) {
        if (denied == true) {
          final reason = room.control.deniedReason;
          final msg = reason == 'busy'
              ? l10n.ctlDeniedBusy
              : reason == 'not_sharing'
                  ? l10n.ctlDeniedNotSharing
                  : l10n.ctlDeniedDenied;
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text(msg)));
        }
      },
    );

    if (room.phase == RoomPhase.error) {
      return _ErrorScreen(
        message: l10n.roomCantJoinText,
        onLeave: () =>
            context.canPop() ? context.pop() : context.go(Routes.dashboard),
      );
    }

    if (room.phase == RoomPhase.waitingForHost) {
      return _ErrorScreen(
        title: l10n.roomWaitingTitle,
        message: l10n.roomWaitingText,
        buttonLabel: l10n.commonCancel,
        onLeave: () =>
            context.canPop() ? context.pop() : context.go(Routes.dashboard),
      );
    }

    if (room.phase == RoomPhase.denied) {
      return _ErrorScreen(
        title: l10n.roomDeniedTitle,
        message: l10n.roomDeniedText,
        onLeave: () =>
            context.canPop() ? context.pop() : context.go(Routes.dashboard),
      );
    }

    final byId = {for (final p in room.participants) p.id: p};

    final tiles = <Widget>[
      VideoTile(
        stream: room.localStream,
        name: user?.name ?? room.me?.displayName ?? '',
        avatarColor: user?.avatarColor ?? room.me?.avatarColor ?? '#1FA84C',
        avatarUrl: user?.avatarUrl ?? room.me?.avatarUrl,
        isSelf: true,
        mirror: room.frontCamera,
        micOff: !room.micOn,
        videoOff: !room.camOn,
        label: '${user?.name ?? room.me?.displayName ?? ''}${l10n.roomYouParen}',
      ),
      for (final entry in room.remoteFeeds.entries)
        Builder(builder: (_) {
          final cid = entry.key;
          final feed = entry.value;
          final p = feed.participantId != null ? byId[feed.participantId] : null;
          final media = room.remoteMedia[cid];
          final name = p?.displayName ?? 'Guest';
          final sharing = media?.screen == true;
          final controllingThis = room.control.controlling?.connectionId == cid;

          return Stack(
            fit: StackFit.expand,
            children: [
              VideoTile(
                stream: feed.stream,
                name: name,
                avatarColor: p?.avatarColor ?? '#667A6F',
                avatarUrl: p?.avatarUrl,
                micOff: media?.audio == false,
                videoOff: media?.video == false,
                label: sharing ? '$name · ${l10n.roomPresenting}' : name,
              ),
              if (controllingThis)
                ControlOverlay(
                  targetName: name,
                  onEvent: ctl.sendControlEvent,
                  onStop: ctl.stopControl,
                )
              else if (sharing && !room.mediaDenied)
                Positioned(
                  right: 8,
                  top: 8,
                  child: _RequestControlButton(
                    state: room.control.requestState,
                    onTap: () => ctl.requestControl(cid),
                  ),
                ),
            ],
          );
        }),
    ];

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (!didPop) await _leave();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF0B130E),
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              _TopBar(room: room, code: widget.code),
              if (room.control.controlledBy != null)
                _ControlledBanner(
                  by: room.control.controlledBy!.name,
                  onStop: ctl.stopControl,
                ),
              Expanded(
                child: tiles.length == 1
                    ? _SoloView(code: widget.code, child: tiles.first)
                    : _Grid(tiles: tiles),
              ),
              RoomControls(
                micOn: room.micOn,
                camOn: room.camOn,
                peopleCount: room.connectedCount,
                unread: room.unread,
                onToggleMic: ctl.toggleMic,
                onToggleCam: ctl.toggleCamera,
                onFlip: ctl.switchCamera,
                onPeople: () => _showPeople(room),
                onChat: _showChat,
                onLeave: _leave,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Grid extends StatelessWidget {
  const _Grid({required this.tiles});
  final List<Widget> tiles;

  @override
  Widget build(BuildContext context) {
    final n = tiles.length;
    // Up to 3 people: stack full-width rows that share the height.
    if (n <= 3) {
      return Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          children: [
            for (var i = 0; i < n; i++) ...[
              if (i > 0) const SizedBox(height: 10),
              Expanded(child: tiles[i]),
            ],
          ],
        ),
      );
    }
    final cols = n <= 6 ? 2 : 3;
    final rows = (n / cols).ceil();
    return LayoutBuilder(builder: (context, box) {
      final ratio = (box.maxWidth / cols) / (box.maxHeight / rows);
      return GridView.count(
        crossAxisCount: cols,
        padding: const EdgeInsets.all(10),
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: ratio,
        physics: const NeverScrollableScrollPhysics(),
        children: tiles,
      );
    });
  }
}

class _SoloView extends StatelessWidget {
  const _SoloView({required this.child, required this.code});
  final Widget child;
  final String code;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(child: Padding(padding: const EdgeInsets.all(12), child: child)),
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
          child: Text(
            context.l10n.roomAlone(code),
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white54, fontSize: 13),
          ),
        ),
      ],
    );
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({required this.room, required this.code});
  final RoomState room;
  final String code;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final (statusText, statusColor) = switch (room.phase) {
      RoomPhase.connected => (l10n.roomLive, const Color(0xFF37C66A)),
      RoomPhase.reconnecting => (l10n.roomReconnecting, const Color(0xFFE0B64A)),
      RoomPhase.disconnected => (l10n.roomDisconnected, const Color(0xFFFF6B6B)),
      _ => (l10n.roomConnecting, Colors.white54),
    };

    return Container(
      padding: const EdgeInsets.fromLTRB(14, 8, 8, 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  room.meeting?.title ?? l10n.roomShareCode,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 15),
                ),
                Row(children: [
                  Container(
                    width: 7,
                    height: 7,
                    decoration:
                        BoxDecoration(color: statusColor, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 6),
                  Text(statusText,
                      style:
                          const TextStyle(color: Colors.white60, fontSize: 12)),
                ]),
              ],
            ),
          ),
          TextButton.icon(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: code));
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(l10n.roomCopied)),
              );
            },
            icon: const Icon(Icons.ios_share, size: 16, color: Colors.white70),
            label: Text(code,
                textDirection: TextDirection.ltr,
                style: const TextStyle(color: Colors.white70, fontSize: 12)),
          ),
        ],
      ),
    );
  }
}

class _RequestControlButton extends StatelessWidget {
  const _RequestControlButton({required this.state, required this.onTap});
  final ControlRequestState state;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final requesting = state == ControlRequestState.requesting;
    return Material(
      color: Colors.black.withValues(alpha: 0.62),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: requesting ? null : onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(requesting ? Icons.hourglass_top_rounded : Icons.mouse_rounded,
                size: 14, color: Colors.white),
            const SizedBox(width: 6),
            Text(requesting ? l10n.ctlRequesting : l10n.ctlRequest,
                style: const TextStyle(color: Colors.white, fontSize: 12)),
          ]),
        ),
      ),
    );
  }
}

class _ControlledBanner extends StatelessWidget {
  const _ControlledBanner({required this.by, required this.onStop});
  final String by;
  final VoidCallback onStop;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Container(
      color: const Color(0xFFD64545),
      padding: const EdgeInsets.fromLTRB(14, 8, 8, 8),
      child: Row(
        children: [
          const Icon(Icons.pan_tool_rounded, size: 16, color: Colors.white),
          const SizedBox(width: 8),
          Expanded(
            child: Text(l10n.ctlControlledBy(by),
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
          ),
          TextButton(
            onPressed: onStop,
            style: TextButton.styleFrom(foregroundColor: Colors.white),
            child: Text(l10n.ctlStop),
          ),
        ],
      ),
    );
  }
}

class _PeopleSheet extends StatelessWidget {
  const _PeopleSheet({
    required this.participants,
    required this.hostUserId,
    required this.isHost,
    required this.onEndMeeting,
  });
  final List<Participant> participants;
  final String? hostUserId;
  final bool isHost;
  final VoidCallback onEndMeeting;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final sorted = [...participants]
      ..sort((a, b) => (b.isConnected ? 1 : 0) - (a.isConnected ? 1 : 0));
    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Text(l10n.roomParticipants,
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.w700)),
          ),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              children: [
                for (final p in sorted)
                  ListTile(
                    leading: BrandAvatar(
                      name: p.displayName,
                      colorHex: p.avatarColor,
                      imageUrl: p.avatarUrl,
                      size: 36,
                    ),
                    title: Text(p.displayName),
                    subtitle: Text(
                      (hostUserId != null && p.userId == hostUserId) ||
                              p.role == ParticipantRole.host
                          ? l10n.roomHost
                          : (p.isConnected ? '' : l10n.roomOffline),
                    ),
                    trailing: Icon(
                      Icons.circle,
                      size: 9,
                      color: p.isConnected
                          ? const Color(0xFF37C66A)
                          : Colors.grey,
                    ),
                  ),
              ],
            ),
          ),
          if (isHost)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  onEndMeeting();
                },
                icon: const Icon(Icons.call_end_rounded),
                label: Text(l10n.roomEndForAll),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Theme.of(context).colorScheme.error,
                  side: BorderSide(color: Theme.of(context).colorScheme.error),
                  minimumSize: const Size.fromHeight(46),
                ),
              ),
            ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _ErrorScreen extends StatelessWidget {
  const _ErrorScreen({
    required this.message,
    required this.onLeave,
    this.title,
    this.buttonLabel,
  });
  final String message;
  final VoidCallback onLeave;
  final String? title;
  final String? buttonLabel;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const BrandLogo(size: 32),
              const SizedBox(height: 18),
              Text(title ?? l10n.roomCantJoinTitle,
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 6),
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: onLeave,
                child: Text(buttonLabel ?? l10n.commonContinue),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
