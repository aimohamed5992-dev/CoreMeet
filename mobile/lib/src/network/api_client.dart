import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_controller.dart';
import '../config/env.dart';

BaseOptions _baseOptions() => BaseOptions(
      baseUrl: Env.apiBase,
      connectTimeout: const Duration(seconds: 12),
      receiveTimeout: const Duration(seconds: 20),
      headers: {'Accept': 'application/json'},
      // We handle non-2xx ourselves via ApiException.
      validateStatus: (s) => s != null && s >= 200 && s < 300,
    );

/// Interceptor-free client. Used for the auth endpoints themselves and for
/// replaying a request after a token refresh (avoids a provider cycle).
final rawDioProvider = Provider<Dio>((ref) => Dio(_baseOptions()));

/// Authenticated client for feature endpoints: attaches the bearer token and
/// transparently refreshes once on a 401 before retrying.
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(_baseOptions());
  final auth = ref.read(authControllerProvider.notifier);

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = auth.accessToken;
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        handler.next(options);
      },
      onError: (error, handler) async {
        final is401 = error.response?.statusCode == 401;
        final alreadyRetried = error.requestOptions.extra['retried'] == true;
        if (!is401 || alreadyRetried) return handler.next(error);

        final refreshed = await auth.refresh();
        if (!refreshed) return handler.next(error);

        final opts = error.requestOptions
          ..extra['retried'] = true
          ..headers['Authorization'] = 'Bearer ${auth.accessToken}';
        try {
          final response = await ref.read(rawDioProvider).fetch(opts);
          return handler.resolve(response);
        } on DioException catch (e) {
          return handler.next(e);
        }
      },
    ),
  );

  return dio;
});
