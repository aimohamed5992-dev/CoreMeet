import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_client.dart';
import '../network/api_exception.dart';
import 'models/auth_session.dart';
import 'models/user.dart';
import 'token_store.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

@immutable
class AuthState {
  const AuthState({required this.status, this.user});

  const AuthState.unknown() : this(status: AuthStatus.unknown);
  const AuthState.signedOut() : this(status: AuthStatus.unauthenticated);

  final AuthStatus status;
  final User? user;

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isResolved => status != AuthStatus.unknown;
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._ref) : super(const AuthState.unknown()) {
    _restore();
  }

  final Ref _ref;
  AuthSession? _session;
  Future<bool>? _refreshInFlight;

  Dio get _raw => _ref.read(rawDioProvider);
  TokenStore get _store => _ref.read(tokenStoreProvider);

  String? get accessToken => _session?.accessToken;

  Future<void> _restore() async {
    final saved = await _store.read();
    if (saved == null) {
      state = const AuthState.signedOut();
      return;
    }
    _session = saved;
    state = AuthState(status: AuthStatus.authenticated, user: saved.user);
    // Verify in the background; a failed refresh will sign out.
    unawaited(_verify());
  }

  Future<void> _verify() async {
    try {
      final res = await _raw.get(
        '/api/auth/me',
        options: Options(headers: {'Authorization': 'Bearer ${_session!.accessToken}'}),
      );
      final user = User.fromJson(res.data as Map<String, dynamic>);
      _session = _session!.copyWith(user: user);
      await _store.write(_session);
      if (mounted) state = AuthState(status: AuthStatus.authenticated, user: user);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        final ok = await refresh();
        if (!ok) await _clear();
      }
      // Other errors (offline): keep the cached session.
    }
  }

  Future<void> login({required String email, required String password}) =>
      _authenticate('/api/auth/login', {'email': email, 'password': password});

  Future<void> register({
    required String name,
    required String email,
    required String password,
  }) =>
      _authenticate('/api/auth/register', {
        'name': name,
        'email': email,
        'password': password,
      });

  Future<void> _authenticate(String path, Map<String, dynamic> body) async {
    try {
      final res = await _raw.post(path, data: body);
      final session =
          AuthSession.fromAuthResponse(res.data as Map<String, dynamic>);
      await _apply(session);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  /// Refreshes the access token. Concurrent callers share one request.
  Future<bool> refresh() {
    return _refreshInFlight ??= _doRefresh()
      ..whenComplete(() => _refreshInFlight = null);
  }

  Future<bool> _doRefresh() async {
    final token = _session?.refreshToken;
    if (token == null) return false;
    try {
      final res = await _raw.post('/api/auth/refresh', data: {'refreshToken': token});
      await _apply(AuthSession.fromAuthResponse(res.data as Map<String, dynamic>));
      return true;
    } on DioException {
      await _clear();
      return false;
    }
  }

  Future<void> logout() async {
    final token = _session?.refreshToken;
    if (token != null) {
      try {
        await _raw.post('/api/auth/logout', data: {'refreshToken': token});
      } on DioException {
        // best effort
      }
    }
    await _clear();
  }

  Future<void> _apply(AuthSession session) async {
    _session = session;
    await _store.write(session);
    state = AuthState(status: AuthStatus.authenticated, user: session.user);
  }

  Future<void> _clear() async {
    _session = null;
    await _store.write(null);
    if (mounted) state = const AuthState.signedOut();
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) => AuthController(ref));
