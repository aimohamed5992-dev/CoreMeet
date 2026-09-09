import 'package:flutter/foundation.dart';

import 'meeting.dart' show parseApiTime;

@immutable
class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.senderParticipantId,
    required this.senderName,
    required this.content,
    required this.sentAt,
  });

  final String id;
  final String senderParticipantId;
  final String senderName;
  final String content;
  final DateTime sentAt;

  factory ChatMessage.fromJson(Map<String, dynamic> j) => ChatMessage(
        id: '${j['id']}',
        senderParticipantId: '${j['senderParticipantId']}',
        senderName: j['senderName'] as String? ?? '',
        content: j['content'] as String? ?? '',
        sentAt: parseApiTime(j['sentAt']),
      );
}
