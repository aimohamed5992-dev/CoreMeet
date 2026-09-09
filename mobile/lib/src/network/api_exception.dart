import 'package:dio/dio.dart';

/// A user-safe failure. [messageKey] maps to an l10n key when the backend
/// message is one we recognise; otherwise [serverMessage] carries the raw text.
class ApiException implements Exception {
  ApiException({this.messageKey, this.serverMessage, this.statusCode});

  final String? messageKey;
  final String? serverMessage;
  final int? statusCode;

  bool get isNetwork => statusCode == null;

  factory ApiException.fromDio(DioException e) {
    final type = e.type;
    if (type == DioExceptionType.connectionError ||
        type == DioExceptionType.connectionTimeout ||
        type == DioExceptionType.receiveTimeout ||
        type == DioExceptionType.sendTimeout) {
      return ApiException(messageKey: 'errorNetwork');
    }

    final status = e.response?.statusCode;
    final data = e.response?.data;
    final serverMessage = data is Map && data['message'] is String
        ? data['message'] as String
        : null;

    return ApiException(
      statusCode: status,
      serverMessage: serverMessage,
      messageKey: _knownKey(serverMessage),
    );
  }

  /// English backend messages → l10n keys (kept in sync with the web app).
  static String? _knownKey(String? message) {
    switch (message) {
      case 'Invalid email or password.':
        return 'errorInvalidCredentials';
      case 'An account with this email already exists.':
        return 'errorEmailExists';
      case 'Meeting not found.':
      case 'This meeting is not available.':
        return 'errorGeneric';
      default:
        return null;
    }
  }
}
