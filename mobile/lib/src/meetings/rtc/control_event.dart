import 'dart:convert';

/// A sink for relayed control events (raw JSON) on the target side.
typedef ControlEventSink = void Function(String json);

/// The control-event contract, byte-compatible with the web client
/// (`frontend/src/lib/meetings/controlEvents.ts`). Coordinates are normalised
/// 0..1 of the shared frame.
sealed class ControlEvent {
  const ControlEvent();
  Map<String, dynamic> toMap();
  String encode() => jsonEncode(toMap());
}

double _clamp01(double n) => n.isNaN ? 0 : (n < 0 ? 0 : (n > 1 ? 1 : n));

class MoveEvent extends ControlEvent {
  const MoveEvent(this.x, this.y);
  final double x, y;
  @override
  Map<String, dynamic> toMap() => {'t': 'move', 'x': _clamp01(x), 'y': _clamp01(y)};
}

class ButtonEvent extends ControlEvent {
  const ButtonEvent(this.kind, this.x, this.y, {this.button = 0});
  final String kind; // down | up | click | dblclick
  final int button; // 0 left, 1 middle, 2 right
  final double x, y;
  @override
  Map<String, dynamic> toMap() =>
      {'t': kind, 'button': button, 'x': _clamp01(x), 'y': _clamp01(y)};
}

class WheelEvent extends ControlEvent {
  const WheelEvent(this.dx, this.dy, this.x, this.y);
  final double dx, dy, x, y;
  @override
  Map<String, dynamic> toMap() =>
      {'t': 'wheel', 'dx': dx, 'dy': dy, 'x': _clamp01(x), 'y': _clamp01(y)};
}

class KeyControlEvent extends ControlEvent {
  const KeyControlEvent({
    required this.code,
    required this.key,
    required this.down,
    this.ctrl = false,
    this.alt = false,
    this.shift = false,
    this.meta = false,
  });
  final String code;
  final String key;
  final bool down;
  final bool ctrl, alt, shift, meta;
  @override
  Map<String, dynamic> toMap() => {
        't': 'key',
        'code': code,
        'key': key,
        'down': down,
        'mods': {'ctrl': ctrl, 'alt': alt, 'shift': shift, 'meta': meta},
      };
}
