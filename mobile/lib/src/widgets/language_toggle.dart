import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../localization/l10n_ext.dart';
import '../localization/locale_controller.dart';

/// Compact pill that flips between English and Arabic.
class LanguageToggle extends ConsumerWidget {
  const LanguageToggle({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isArabic = Localizations.localeOf(context).languageCode == 'ar';
    final label = isArabic ? context.l10n.switchToEnglish : context.l10n.switchToArabic;

    return TextButton.icon(
      onPressed: () => ref.read(localeControllerProvider.notifier).toggle(context),
      icon: const Icon(Icons.language, size: 18),
      label: Text(label),
      style: TextButton.styleFrom(
        foregroundColor: Theme.of(context).colorScheme.onSurface,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999),
          side: BorderSide(color: Theme.of(context).colorScheme.outline),
        ),
      ),
    );
  }
}
