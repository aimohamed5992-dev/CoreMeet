import 'package:intl/intl.dart';

/// Short localised "time ago" using the ICU relative-time data bundled with
/// `intl` for the given locale (falls back to English rules for others).
String relativeTime(DateTime when, String localeCode) {
  final diff = DateTime.now().difference(when);
  final mins = diff.inMinutes;

  if (mins < 1) return _t(localeCode, now: true);
  if (mins < 60) return _unit(localeCode, mins, _Unit.minute);
  final hours = diff.inHours;
  if (hours < 24) return _unit(localeCode, hours, _Unit.hour);
  final days = diff.inDays;
  if (days < 7) return _unit(localeCode, days, _Unit.day);

  return DateFormat.yMMMd(localeCode).format(when);
}

enum _Unit { minute, hour, day }

String _t(String locale, {required bool now}) =>
    locale.startsWith('ar') ? 'الآن' : 'just now';

String _unit(String locale, int n, _Unit unit) {
  if (locale.startsWith('ar')) {
    final word = switch (unit) {
      _Unit.minute => _arPlural(n, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة'),
      _Unit.hour => _arPlural(n, 'ساعة', 'ساعتين', 'ساعات', 'ساعة'),
      _Unit.day => _arPlural(n, 'يوم', 'يومين', 'أيام', 'يومًا'),
    };
    if (n == 1 || n == 2) return 'قبل $word';
    return 'قبل $n $word';
  }
  final word = switch (unit) {
    _Unit.minute => 'minute',
    _Unit.hour => 'hour',
    _Unit.day => 'day',
  };
  return '$n $word${n == 1 ? '' : 's'} ago';
}

String _arPlural(int n, String one, String two, String few, String many) {
  if (n == 1) return one;
  if (n == 2) return two;
  if (n % 100 >= 3 && n % 100 <= 10) return few;
  return many;
}
