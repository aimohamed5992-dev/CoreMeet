import 'package:flutter/foundation.dart';

enum MeetingStatus { scheduled, active, ended }

MeetingStatus _statusFrom(Object? v) {
  final i = v is int ? v : int.tryParse('$v') ?? 0;
  return MeetingStatus.values[i.clamp(0, MeetingStatus.values.length - 1)];
}

enum ParticipantRole { guest, coHost, host }

ParticipantRole _roleFrom(Object? v) {
  final i = v is int ? v : int.tryParse('$v') ?? 0;
  return ParticipantRole.values[i.clamp(0, ParticipantRole.values.length - 1)];
}

/// Parse an API timestamp. The backend stores UTC; a value without a `Z` or
/// offset is still treated as UTC before converting to the device's local time.
DateTime parseApiTime(Object? v) {
  final s = '$v';
  final dt = DateTime.tryParse(s);
  if (dt == null) return DateTime.now();
  final hasZone =
      s.endsWith('Z') || RegExp(r'[+-]\d\d:?\d\d$').hasMatch(s);
  if (hasZone || dt.isUtc) return dt.toLocal();
  return DateTime.utc(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second,
          dt.millisecond, dt.microsecond)
      .toLocal();
}

@immutable
class Participant {
  const Participant({
    required this.id,
    required this.userId,
    required this.displayName,
    required this.role,
    required this.avatarColor,
    required this.avatarUrl,
    required this.isConnected,
  });

  final String id;
  final String? userId;
  final String displayName;
  final ParticipantRole role;
  final String avatarColor;
  final String? avatarUrl;
  final bool isConnected;

  factory Participant.fromJson(Map<String, dynamic> j) => Participant(
        id: j['id'] as String,
        userId: j['userId'] as String?,
        displayName: j['displayName'] as String? ?? 'Guest',
        role: _roleFrom(j['role']),
        avatarColor: j['avatarColor'] as String? ?? '#667A6F',
        avatarUrl: (j['avatarUrl'] as String?)?.isEmpty ?? true
            ? null
            : j['avatarUrl'] as String?,
        isConnected: j['isConnected'] as bool? ?? false,
      );

  Participant copyWith({bool? isConnected, String? displayName}) => Participant(
        id: id,
        userId: userId,
        displayName: displayName ?? this.displayName,
        role: role,
        avatarColor: avatarColor,
        avatarUrl: avatarUrl,
        isConnected: isConnected ?? this.isConnected,
      );
}

@immutable
class MeetingSummary {
  const MeetingSummary({
    required this.id,
    required this.code,
    required this.title,
    required this.status,
    required this.hostId,
    required this.hostName,
    required this.createdAt,
    required this.participantCount,
  });

  final String id;
  final String code;
  final String title;
  final MeetingStatus status;
  final String hostId;
  final String hostName;
  final DateTime createdAt;
  final int participantCount;

  factory MeetingSummary.fromJson(Map<String, dynamic> j) => MeetingSummary(
        id: j['id'] as String,
        code: j['code'] as String,
        title: j['title'] as String? ?? '',
        status: _statusFrom(j['status']),
        hostId: j['hostId'] as String? ?? '',
        hostName: j['hostName'] as String? ?? '',
        createdAt: parseApiTime(j['createdAt']),
        participantCount: (j['participantCount'] as num?)?.toInt() ?? 0,
      );
}

@immutable
class MeetingDetail {
  const MeetingDetail({
    required this.id,
    required this.code,
    required this.title,
    required this.status,
    required this.hostId,
    required this.hostName,
    required this.participants,
  });

  final String id;
  final String code;
  final String title;
  final MeetingStatus status;
  final String hostId;
  final String hostName;
  final List<Participant> participants;

  int get connectedCount => participants.where((p) => p.isConnected).length;

  factory MeetingDetail.fromJson(Map<String, dynamic> j) => MeetingDetail(
        id: j['id'] as String,
        code: j['code'] as String,
        title: j['title'] as String? ?? '',
        status: _statusFrom(j['status']),
        hostId: j['hostId'] as String? ?? '',
        hostName: j['hostName'] as String? ?? '',
        participants: ((j['participants'] as List?) ?? const [])
            .map((e) => Participant.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

@immutable
class JoinResult {
  const JoinResult({required this.meeting, required this.me});

  final MeetingDetail meeting;
  final Participant me;

  factory JoinResult.fromJson(Map<String, dynamic> j) => JoinResult(
        meeting: MeetingDetail.fromJson(j['meeting'] as Map<String, dynamic>),
        me: Participant.fromJson(j['me'] as Map<String, dynamic>),
      );
}
