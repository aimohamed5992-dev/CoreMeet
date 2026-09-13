import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../l10n/app_localizations.dart';

/// Locale choice. English is the default; Arabic is opt-in and persisted.
/// `null` in storage means "follow the device", resolved against supported locales.
class LocaleController extends StateNotifier<Locale?> {
  LocaleController(this._prefs) : super(_read(_prefs));

  static const _key = 'coremeet.locale';
  final SharedPreferences _prefs;

  static Locale? _read(SharedPreferences prefs) {
    final code = prefs.getString(_key);
    if (code == null) return null;
    return L.supportedLocales
        .cast<Locale?>()
        .firstWhere((l) => l?.languageCode == code, orElse: () => null);
  }

  Future<void> setLocale(Locale? locale) async {
    state = locale;
    if (locale == null) {
      await _prefs.remove(_key);
    } else {
      await _prefs.setString(_key, locale.languageCode);
    }
  }

  Future<void> toggle(BuildContext context) {
    final current = state?.languageCode ??
        Localizations.localeOf(context).languageCode;
    return setLocale(Locale(current == 'ar' ? 'en' : 'ar'));
  }
}

/// Provided with an override in [main] once SharedPreferences is ready.
final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('sharedPreferencesProvider not initialised'),
);

final localeControllerProvider =
    StateNotifierProvider<LocaleController, Locale?>(
  (ref) => LocaleController(ref.watch(sharedPreferencesProvider)),
);
