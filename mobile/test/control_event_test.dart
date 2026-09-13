import 'dart:convert';

import 'package:coremeet/src/meetings/rtc/control_event.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ControlEvent encoding (must match the web contract)', () {
    test('move clamps and shapes', () {
      expect(jsonDecode(const MoveEvent(0.5, 1.4).encode()),
          {'t': 'move', 'x': 0.5, 'y': 1.0});
    });

    test('button', () {
      expect(jsonDecode(const ButtonEvent('click', 0.25, 0.75).encode()),
          {'t': 'click', 'button': 0, 'x': 0.25, 'y': 0.75});
      expect(jsonDecode(const ButtonEvent('down', 0, 0, button: 2).encode()),
          {'t': 'down', 'button': 2, 'x': 0.0, 'y': 0.0});
    });

    test('wheel', () {
      expect(jsonDecode(const WheelEvent(0, 120, 0.5, 0.5).encode()),
          {'t': 'wheel', 'dx': 0, 'dy': 120, 'x': 0.5, 'y': 0.5});
    });

    test('key carries mods object', () {
      final m = jsonDecode(const KeyControlEvent(
        code: 'KeyC',
        key: 'c',
        down: true,
        ctrl: true,
      ).encode());
      expect(m['t'], 'key');
      expect(m['code'], 'KeyC');
      expect(m['down'], true);
      expect(m['mods'],
          {'ctrl': true, 'alt': false, 'shift': false, 'meta': false});
    });
  });
}
