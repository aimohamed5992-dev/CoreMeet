import 'package:flutter/foundation.dart';

import 'user.dart';

@immutable
class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  final String accessToken;
  final String refreshToken;
  final User user;

  /// Parses the API's `AuthResponse` shape.
  factory AuthSession.fromAuthResponse(Map<String, dynamic> json) => AuthSession(
        accessToken: json['accessToken'] as String,
        refreshToken: json['refreshToken'] as String,
        user: User.fromJson(json['user'] as Map<String, dynamic>),
      );

  factory AuthSession.fromJson(Map<String, dynamic> json) => AuthSession(
        accessToken: json['accessToken'] as String,
        refreshToken: json['refreshToken'] as String,
        user: User.fromJson(json['user'] as Map<String, dynamic>),
      );

  Map<String, dynamic> toJson() => {
        'accessToken': accessToken,
        'refreshToken': refreshToken,
        'user': user.toJson(),
      };

  AuthSession copyWith({
    String? accessToken,
    String? refreshToken,
    User? user,
  }) =>
      AuthSession(
        accessToken: accessToken ?? this.accessToken,
        refreshToken: refreshToken ?? this.refreshToken,
        user: user ?? this.user,
      );
}
