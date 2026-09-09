import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/auth_controller.dart';
import '../../localization/l10n_ext.dart';
import '../../localization/locale_controller.dart';
import '../../meetings/meetings_repository.dart';
import '../../theme/app_theme.dart';
import '../../widgets/brand_logo.dart';
import 'widgets/join_card.dart';
import 'widgets/meeting_tile.dart';
import 'widgets/new_meeting_card.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  String _greeting(BuildContext context) {
    final l10n = context.l10n;
    final h = DateTime.now().hour;
    if (h < 12) return l10n.dashGreetingMorning;
    if (h < 18) return l10n.dashGreetingAfternoon;
    return l10n.dashGreetingEvening;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final user = ref.watch(authControllerProvider).user;
    final meetings = ref.watch(myMeetingsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const BrandLogo(size: 24),
        actions: [
          PopupMenuButton<String>(
            icon: BrandAvatar(
              name: user?.name ?? '',
              colorHex: user?.avatarColor ?? '#1FA84C',
              imageUrl: user?.avatarUrl,
              size: 32,
            ),
            onSelected: (value) {
              if (value == 'lang') {
                ref.read(localeControllerProvider.notifier).toggle(context);
              } else if (value == 'signout') {
                ref.read(authControllerProvider.notifier).logout();
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'lang',
                child: Row(children: [
                  const Icon(Icons.language, size: 18),
                  const SizedBox(width: 10),
                  Text(Localizations.localeOf(context).languageCode == 'ar'
                      ? l10n.switchToEnglish
                      : l10n.switchToArabic),
                ]),
              ),
              PopupMenuItem(
                value: 'signout',
                child: Row(children: [
                  const Icon(Icons.logout, size: 18),
                  const SizedBox(width: 10),
                  Text(l10n.dashSignOut),
                ]),
              ),
            ],
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(myMeetingsProvider.future),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            Text(
              l10n.dashGreetingLine(_greeting(context), user?.name ?? ''),
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 18),
            const NewMeetingCard(),
            const SizedBox(height: 12),
            const JoinCard(),
            const SizedBox(height: 26),
            Text(l10n.dashRecent,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 12),
            meetings.when(
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: 28),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (_, __) => _Message(
                icon: Icons.cloud_off_rounded,
                text: l10n.dashErrorLoad,
                action: TextButton(
                  onPressed: () => ref.invalidate(myMeetingsProvider),
                  child: Text(l10n.commonRetry),
                ),
              ),
              data: (list) => list.isEmpty
                  ? _Message(
                      icon: Icons.event_note_rounded,
                      text: l10n.dashRecentEmpty,
                    )
                  : Column(
                      children: [
                        for (final m in list)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: MeetingTile(m),
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

class _Message extends StatelessWidget {
  const _Message({required this.icon, required this.text, this.action});

  final IconData icon;
  final String text;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Column(
        children: [
          Icon(icon, size: 34, color: context.colors.textMuted),
          const SizedBox(height: 10),
          Text(text,
              textAlign: TextAlign.center,
              style: TextStyle(color: context.colors.textMuted)),
          if (action != null) ...[const SizedBox(height: 4), action!],
        ],
      ),
    );
  }
}
