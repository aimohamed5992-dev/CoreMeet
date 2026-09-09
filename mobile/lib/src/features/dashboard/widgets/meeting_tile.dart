import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../localization/l10n_ext.dart';
import '../../../meetings/models/meeting.dart';
import '../../../meetings/widgets/meeting_status_chip.dart';
import '../../../router/app_router.dart';
import '../../../theme/app_theme.dart';
import '../../../util/relative_time.dart';

class MeetingTile extends StatelessWidget {
  const MeetingTile(this.meeting, {super.key});

  final MeetingSummary meeting;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final scheme = Theme.of(context).colorScheme;
    final localeCode = Localizations.localeOf(context).languageCode;

    return Material(
      color: scheme.surface,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => context.push(Routes.lobby(meeting.code)),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: scheme.outline),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      meeting.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                  ),
                  const SizedBox(width: 8),
                  MeetingStatusChip(meeting.status),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Text(
                    meeting.code,
                    style: TextStyle(
                      color: context.colors.textMuted,
                      fontFeatures: const [FontFeature.tabularFigures()],
                      fontSize: 12.5,
                      letterSpacing: 0.3,
                    ),
                    textDirection: TextDirection.ltr,
                  ),
                  Text('  ·  ', style: TextStyle(color: context.colors.textMuted)),
                  Flexible(
                    child: Text(
                      '${l10n.meetingPeople(meeting.participantCount)} · ${relativeTime(meeting.createdAt, localeCode)}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          color: context.colors.textMuted, fontSize: 12.5),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
