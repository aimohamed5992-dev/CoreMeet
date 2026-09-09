import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../localization/l10n_ext.dart';
import '../../../meetings/models/chat_message.dart';
import '../../../meetings/rtc/room_controller.dart';
import '../../../theme/app_theme.dart';

class ChatSheet extends ConsumerStatefulWidget {
  const ChatSheet({super.key, required this.code});
  final String code;

  @override
  ConsumerState<ChatSheet> createState() => _ChatSheetState();
}

class _ChatSheetState extends ConsumerState<ChatSheet> {
  final _controller = TextEditingController();
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(roomControllerProvider(widget.code).notifier).markChatRead();
      _jump();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _jump() {
    if (_scroll.hasClients) {
      _scroll.jumpTo(_scroll.position.maxScrollExtent);
    }
  }

  void _send() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    ref.read(roomControllerProvider(widget.code).notifier).sendChat(text);
    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final room = ref.watch(roomControllerProvider(widget.code));
    final meId = room.me?.id;
    ref.listen(roomControllerProvider(widget.code).select((s) => s.messages.length),
        (_, __) {
      ref.read(roomControllerProvider(widget.code).notifier).markChatRead();
      WidgetsBinding.instance.addPostFrameCallback((_) => _jump());
    });

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.7,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
              child: Row(
                children: [
                  Text(l10n.chatTitle,
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w700)),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: room.messages.isEmpty
                  ? Center(
                      child: Text(l10n.chatEmpty,
                          style: TextStyle(color: context.colors.textMuted)),
                    )
                  : ListView.builder(
                      controller: _scroll,
                      padding: const EdgeInsets.all(14),
                      itemCount: room.messages.length,
                      itemBuilder: (_, i) => _Bubble(
                        message: room.messages[i],
                        mine: room.messages[i].senderParticipantId == meId,
                      ),
                    ),
            ),
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      textInputAction: TextInputAction.send,
                      minLines: 1,
                      maxLines: 4,
                      inputFormatters: [LengthLimitingTextInputFormatter(4000)],
                      onSubmitted: (_) => _send(),
                      decoration: InputDecoration(
                        hintText: l10n.chatPlaceholder,
                        isDense: true,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _send,
                    icon: const Icon(Icons.send_rounded),
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

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message, required this.mine});
  final ChatMessage message;
  final bool mine;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.72),
        child: Column(
          crossAxisAlignment:
              mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            if (!mine)
              Padding(
                padding: const EdgeInsets.only(left: 4, bottom: 2),
                child: Text(message.senderName,
                    style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: scheme.primary)),
              ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: mine ? scheme.primary : scheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                message.content,
                style: TextStyle(color: mine ? Colors.white : scheme.onSurface),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 2, left: 4, right: 4),
              child: Text(
                DateFormat.Hm().format(message.sentAt),
                style: TextStyle(fontSize: 10, color: context.colors.textMuted),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
