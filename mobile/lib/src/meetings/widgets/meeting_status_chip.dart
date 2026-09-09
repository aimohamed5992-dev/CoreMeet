import 'package:flutter/material.dart';

import '../../localization/l10n_ext.dart';
import '../../theme/app_theme.dart';
import '../models/meeting.dart';

class MeetingStatusChip extends StatelessWidget {
  const MeetingStatusChip(this.status, {super.key});

  final MeetingStatus status;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final (label, color) = switch (status) {
      MeetingStatus.active => (l10n.meetingStatusActive, BrandColors.brand500),
      MeetingStatus.scheduled => (l10n.meetingStatusScheduled, context.colors.textMuted),
      MeetingStatus.ended => (l10n.meetingStatusEnded, BrandColors.danger),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (status == MeetingStatus.active) ...[
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
            const SizedBox(width: 5),
          ],
          Text(
            label,
            style: TextStyle(
                color: color, fontSize: 11.5, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
