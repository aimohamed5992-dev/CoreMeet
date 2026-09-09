import '../../l10n/app_localizations.dart';
import 'api_exception.dart';

/// Resolves an [ApiException] to a message to show the user.
String errorText(L l10n, Object error, {String? fallbackKey}) {
  if (error is ApiException) {
    final key = error.messageKey;
    if (key != null) return _byKey(l10n, key);
    if (error.serverMessage != null && error.serverMessage!.isNotEmpty) {
      return error.serverMessage!;
    }
    if (error.isNetwork) return l10n.errorNetwork;
  }
  return _byKey(l10n, fallbackKey ?? 'errorGeneric');
}

String _byKey(L l10n, String key) {
  switch (key) {
    case 'errorInvalidCredentials':
      return l10n.errorInvalidCredentials;
    case 'errorEmailExists':
      return l10n.errorEmailExists;
    case 'errorNetwork':
      return l10n.errorNetwork;
    case 'errorSignInFailed':
      return l10n.errorSignInFailed;
    case 'errorCreateFailed':
      return l10n.errorCreateFailed;
    default:
      return l10n.errorGeneric;
  }
}
