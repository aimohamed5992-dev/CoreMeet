import '../../../l10n/app_localizations.dart';

/// Form validators that return a localised message or null when valid.
class Validators {
  const Validators(this.l10n);
  final L l10n;

  static final _emailRe = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

  String? email(String? value) {
    final v = value?.trim() ?? '';
    if (v.isEmpty) return l10n.validationEmailRequired;
    if (!_emailRe.hasMatch(v)) return l10n.validationEmailInvalid;
    return null;
  }

  String? password(String? value, {bool requireLength = false}) {
    final v = value ?? '';
    if (v.isEmpty) return l10n.validationPasswordRequired;
    if (requireLength && v.length < 8) return l10n.validationPasswordShort;
    return null;
  }

  String? name(String? value) {
    if ((value?.trim() ?? '').isEmpty) return l10n.validationNameRequired;
    return null;
  }
}
