import 'package:coremeet/src/meetings/meeting_code.dart';
import 'package:coremeet/src/meetings/models/meeting.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('parseMeetingCode', () {
    test('accepts a bare code', () {
      expect(parseMeetingCode('abc-defg-hij'), 'abc-defg-hij');
      expect(parseMeetingCode('ABC-DEFG-HIJ'), 'abc-defg-hij');
      expect(parseMeetingCode('abcdefghij'), 'abc-defg-hij');
      expect(parseMeetingCode('  abc-defg-hij  '), 'abc-defg-hij');
    });

    test('extracts from a link', () {
      expect(
        parseMeetingCode('https://coremeet.urapp4u.com/meeting/abc-defg-hij'),
        'abc-defg-hij',
      );
      expect(parseMeetingCode('coremeet.app/join/xyz-wxyz-tuv'), 'xyz-wxyz-tuv');
    });

    test('rejects junk', () {
      expect(parseMeetingCode(''), isNull);
      expect(parseMeetingCode('hello'), isNull);
      expect(parseMeetingCode('123-4567-890'), isNull);
    });
  });

  group('parseApiTime', () {
    test('treats a bare timestamp as UTC', () {
      final withZ = parseApiTime('2026-01-01T12:00:00Z');
      final bare = parseApiTime('2026-01-01T12:00:00');
      expect(withZ.toUtc(), bare.toUtc());
      expect(withZ.isUtc, isFalse); // converted to local
    });

    test('falls back to now on garbage', () {
      final t = parseApiTime('not a date');
      expect(DateTime.now().difference(t).inSeconds.abs(), lessThan(5));
    });
  });
}
