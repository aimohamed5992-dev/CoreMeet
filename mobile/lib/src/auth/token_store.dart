import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'models/auth_session.dart';

/// Persists the auth session in the platform keystore / keychain.
class TokenStore {
  TokenStore(this._storage);

  static const _key = 'coremeet.session';
  final FlutterSecureStorage _storage;

  Future<AuthSession?> read() async {
    final raw = await _storage.read(key: _key);
    if (raw == null) return null;
    try {
      return AuthSession.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      await _storage.delete(key: _key);
      return null;
    }
  }

  Future<void> write(AuthSession? session) async {
    if (session == null) {
      await _storage.delete(key: _key);
    } else {
      await _storage.write(key: _key, value: jsonEncode(session.toJson()));
    }
  }
}

final tokenStoreProvider = Provider<TokenStore>(
  (ref) => TokenStore(
    const FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
    ),
  ),
);
