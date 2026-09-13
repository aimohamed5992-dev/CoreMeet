import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/auth_controller.dart';
import '../../localization/l10n_ext.dart';
import '../../meetings/meetings_repository.dart';
import '../../meetings/models/meeting.dart';
import '../../network/api_exception.dart';
import '../../network/error_text.dart';
import '../../router/app_router.dart';
import '../../theme/app_theme.dart';
import '../../widgets/brand_logo.dart';
import '../../widgets/busy_button.dart';
import 'lobby_controller.dart';

class LobbyScreen extends ConsumerStatefulWidget {
  const LobbyScreen({super.key, required this.code});
  final String code;

  @override
  ConsumerState<LobbyScreen> createState() => _LobbyScreenState();
}

class _LobbyScreenState extends ConsumerState<LobbyScreen> {
  bool _joining = false;

  void _leave() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go(Routes.dashboard);
    }
  }

  Future<void> _join() async {
    setState(() => _joining = true);
    try {
      // Validate the meeting is joinable before entering the room; the room
      // controller re-joins (idempotent) once the hub is up.
      await ref.read(meetingsRepositoryProvider).join(widget.code);
      ref.invalidate(myMeetingsProvider);
      if (mounted) context.pushReplacement(Routes.room(widget.code));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(errorText(context.l10n, e))));
      }
    } finally {
      if (mounted) setState(() => _joining = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final async = ref.watch(lobbyMeetingProvider(widget.code));

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: _leave,
          icon: const Icon(Icons.close),
        ),
        title: const BrandLogo(size: 22, showName: false),
      ),
      body: async.when(
        loading: () => _Centered(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 14),
            Text(l10n.lobbyGettingReady,
                style: TextStyle(color: context.colors.textMuted)),
          ]),
        ),
        error: (err, _) {
          final offline = err is ApiException && err.isNetwork;
          return _NotFound(onLeave: _leave, offline: offline);
        },
        data: (meeting) {
          if (meeting.status == MeetingStatus.ended) {
            return _Ended(onLeave: _leave);
          }
          return _Ready(
            meeting: meeting,
            joining: _joining,
            onJoin: _join,
          );
        },
      ),
    );
  }
}

class _Ready extends ConsumerWidget {
  const _Ready({
    required this.meeting,
    required this.joining,
    required this.onJoin,
  });

  final MeetingDetail meeting;
  final bool joining;
  final VoidCallback onJoin;

  String _peopleLine(BuildContext context) {
    final n = meeting.connectedCount;
    final l10n = context.l10n;
    if (n == 0) return l10n.lobbyFirstHere;
    if (n == 1) return l10n.lobbyOnePersonIn;
    return l10n.lobbyPeopleIn(n);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final user = ref.watch(authControllerProvider).user;
    final prefs = ref.watch(lobbyPrefsProvider);
    final prefsCtl = ref.read(lobbyPrefsProvider.notifier);

    return SafeArea(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Preview placeholder — real camera preview arrives with WebRTC.
                AspectRatio(
                  aspectRatio: 4 / 3,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        BrandAvatar(
                          name: user?.name ?? '',
                          colorHex: user?.avatarColor ?? '#1FA84C',
                          imageUrl: user?.avatarUrl,
                          size: 72,
                        ),
                        const SizedBox(height: 12),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Text(
                            l10n.lobbyCameraNote,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                color: context.colors.textMuted, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _Toggle(
                      on: prefs.micOn,
                      onIcon: Icons.mic_rounded,
                      offIcon: Icons.mic_off_rounded,
                      label: prefs.micOn ? l10n.lobbyMicOn : l10n.lobbyMicOff,
                      onTap: prefsCtl.toggleMic,
                    ),
                    const SizedBox(width: 12),
                    _Toggle(
                      on: prefs.cameraOn,
                      onIcon: Icons.videocam_rounded,
                      offIcon: Icons.videocam_off_rounded,
                      label: prefs.cameraOn ? l10n.lobbyCameraOn : l10n.lobbyCameraOff,
                      onTap: prefsCtl.toggleCamera,
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Text(
                  meeting.title,
                  textAlign: TextAlign.center,
                  style: Theme.of(context)
                      .textTheme
                      .titleLarge
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(
                  _peopleLine(context),
                  textAlign: TextAlign.center,
                  style: TextStyle(color: context.colors.textMuted),
                ),
                const SizedBox(height: 22),
                BusyButton(
                  label: joining ? l10n.lobbyJoining : l10n.lobbyJoinNow,
                  busy: joining,
                  onPressed: onJoin,
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => context.canPop()
                      ? context.pop()
                      : context.go(Routes.dashboard),
                  child: Text(l10n.lobbyLeave),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Toggle extends StatelessWidget {
  const _Toggle({
    required this.on,
    required this.onIcon,
    required this.offIcon,
    required this.label,
    required this.onTap,
  });

  final bool on;
  final IconData onIcon;
  final IconData offIcon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(on ? onIcon : offIcon, size: 18),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        foregroundColor: on ? scheme.onSurface : scheme.error,
        side: BorderSide(color: on ? scheme.outline : scheme.error),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      ),
    );
  }
}

class _Centered extends StatelessWidget {
  const _Centered({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => Center(child: child);
}

class _NotFound extends StatelessWidget {
  const _NotFound({required this.onLeave, required this.offline});
  final VoidCallback onLeave;
  final bool offline;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return _Centered(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(offline ? Icons.cloud_off_rounded : Icons.link_off_rounded,
              size: 40, color: context.colors.textMuted),
          const SizedBox(height: 14),
          Text(offline ? l10n.errorNetwork : l10n.lobbyNotFoundTitle,
              textAlign: TextAlign.center,
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700)),
          if (!offline) ...[
            const SizedBox(height: 6),
            Text(l10n.lobbyNotFoundText,
                textAlign: TextAlign.center,
                style: TextStyle(color: context.colors.textMuted)),
          ],
          const SizedBox(height: 18),
          FilledButton(onPressed: onLeave, child: Text(l10n.lobbyLeave)),
        ]),
      ),
    );
  }
}

class _Ended extends StatelessWidget {
  const _Ended({required this.onLeave});
  final VoidCallback onLeave;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return _Centered(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.event_busy_rounded,
              size: 40, color: context.colors.textMuted),
          const SizedBox(height: 14),
          Text(l10n.lobbyEnded,
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 18),
          FilledButton(onPressed: onLeave, child: Text(l10n.lobbyLeave)),
        ]),
      ),
    );
  }
}
