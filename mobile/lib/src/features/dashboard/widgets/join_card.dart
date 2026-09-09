import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../localization/l10n_ext.dart';
import '../../../meetings/meeting_code.dart';
import '../../../router/app_router.dart';
import '../../../theme/app_theme.dart';

class JoinCard extends ConsumerStatefulWidget {
  const JoinCard({super.key});

  @override
  ConsumerState<JoinCard> createState() => _JoinCardState();
}

class _JoinCardState extends ConsumerState<JoinCard> {
  final _controller = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _join() {
    final code = parseMeetingCode(_controller.text);
    if (code == null) {
      setState(() => _error = context.l10n.joinInvalidCode);
      return;
    }
    FocusScope.of(context).unfocus();
    context.push(Routes.lobby(code));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final scheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: scheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.keyboard_rounded, size: 20, color: context.colors.textMuted),
              const SizedBox(width: 8),
              Text(l10n.joinTitle,
                  style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  textInputAction: TextInputAction.go,
                  autocorrect: false,
                  inputFormatters: [
                    FilteringTextInputFormatter.deny(RegExp(r'\s')),
                  ],
                  onChanged: (_) {
                    if (_error != null) setState(() => _error = null);
                  },
                  onSubmitted: (_) => _join(),
                  decoration: InputDecoration(
                    hintText: l10n.joinPlaceholder,
                    errorText: _error,
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              FilledButton(
                onPressed: _join,
                style: FilledButton.styleFrom(
                  minimumSize: const Size(0, 48),
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                ),
                child: Text(l10n.joinCta),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
