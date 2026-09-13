import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_client.dart';
import '../network/api_exception.dart';
import 'models/meeting.dart';

class MeetingsRepository {
  MeetingsRepository(this._dio);
  final Dio _dio;

  Future<MeetingSummary> create({String? title}) => _guard(() async {
        final res = await _dio.post('/api/meetings', data: {'title': title});
        return MeetingSummary.fromJson(res.data as Map<String, dynamic>);
      });

  Future<List<MeetingSummary>> listMine() => _guard(() async {
        final res = await _dio.get('/api/meetings/mine');
        return ((res.data as List?) ?? const [])
            .map((e) => MeetingSummary.fromJson(e as Map<String, dynamic>))
            .toList();
      });

  Future<MeetingDetail> getByCode(String code) => _guard(() async {
        final res = await _dio.get('/api/meetings/${Uri.encodeComponent(code)}');
        return MeetingDetail.fromJson(res.data as Map<String, dynamic>);
      });

  Future<JoinResult> join(String code, {String? displayName}) => _guard(() async {
        final res = await _dio.post(
          '/api/meetings/${Uri.encodeComponent(code)}/join',
          data: {'displayName': displayName},
        );
        return JoinResult.fromJson(res.data as Map<String, dynamic>);
      });

  Future<void> end(String code) => _guard(() async {
        await _dio.post('/api/meetings/${Uri.encodeComponent(code)}/end');
      });

  Future<T> _guard<T>(Future<T> Function() run) async {
    try {
      return await run();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final meetingsRepositoryProvider = Provider<MeetingsRepository>(
  (ref) => MeetingsRepository(ref.watch(dioProvider)),
);

/// The signed-in user's meetings, newest first. Refreshable via `ref.invalidate`.
final myMeetingsProvider = FutureProvider.autoDispose<List<MeetingSummary>>(
  (ref) => ref.watch(meetingsRepositoryProvider).listMine(),
);
