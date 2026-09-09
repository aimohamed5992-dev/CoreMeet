import 'package:flutter/material.dart';

import '../../../localization/l10n_ext.dart';
import '../../../meetings/rtc/control_event.dart';

/// Transparent layer placed over the presenter's video while this device is the
/// active controller. Turns touches into normalised pointer events and offers a
/// keyboard field for typing. Coordinates are 0..1 of the tile.
class ControlOverlay extends StatefulWidget {
  const ControlOverlay({
    super.key,
    required this.targetName,
    required this.onEvent,
    required this.onStop,
  });

  final String targetName;
  final void Function(ControlEvent) onEvent;
  final VoidCallback onStop;

  @override
  State<ControlOverlay> createState() => _ControlOverlayState();
}

class _ControlOverlayState extends State<ControlOverlay> {
  final _keyController = TextEditingController();
  final _keyFocus = FocusNode();
  Size _size = Size.zero;
  bool _keyboard = false;

  @override
  void dispose() {
    _keyController.dispose();
    _keyFocus.dispose();
    super.dispose();
  }

  ({double x, double y}) _norm(Offset local) => (
        x: _size.width == 0 ? 0.0 : (local.dx / _size.width).clamp(0.0, 1.0).toDouble(),
        y: _size.height == 0 ? 0.0 : (local.dy / _size.height).clamp(0.0, 1.0).toDouble(),
      );

  void _emitMove(Offset local) {
    final n = _norm(local);
    widget.onEvent(MoveEvent(n.x, n.y));
  }

  void _onKeyText(String value) {
    // Send the newly typed characters as key events, then clear.
    for (final ch in value.split('')) {
      widget.onEvent(KeyControlEvent(
        code: _codeFor(ch),
        key: ch,
        down: true,
        shift: ch.toUpperCase() == ch && ch.toLowerCase() != ch,
      ));
      widget.onEvent(KeyControlEvent(code: _codeFor(ch), key: ch, down: false));
    }
    _keyController.clear();
  }

  static String _codeFor(String ch) {
    final u = ch.toUpperCase();
    if (RegExp(r'[A-Z]').hasMatch(u)) return 'Key$u';
    if (RegExp(r'[0-9]').hasMatch(ch)) return 'Digit$ch';
    if (ch == ' ') return 'Space';
    return '';
  }

  void _special(String code, String key) {
    widget.onEvent(KeyControlEvent(code: code, key: key, down: true));
    widget.onEvent(KeyControlEvent(code: code, key: key, down: false));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Positioned.fill(
      child: LayoutBuilder(builder: (context, box) {
        _size = Size(box.maxWidth, box.maxHeight);
        return Stack(
          children: [
            GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTapUp: (d) {
                final n = _norm(d.localPosition);
                widget.onEvent(ButtonEvent('click', n.x, n.y));
              },
              onDoubleTapDown: (d) {
                final n = _norm(d.localPosition);
                widget.onEvent(ButtonEvent('dblclick', n.x, n.y));
              },
              onLongPressStart: (d) {
                final n = _norm(d.localPosition);
                widget.onEvent(ButtonEvent('down', n.x, n.y, button: 2));
                widget.onEvent(ButtonEvent('up', n.x, n.y, button: 2));
              },
              onPanStart: (d) => _emitMove(d.localPosition),
              onPanUpdate: (d) => _emitMove(d.localPosition),
              child: const SizedBox.expand(),
            ),
            // Controller HUD
            Positioned(
              left: 12,
              right: 12,
              top: 10,
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        l10n.ctlControllingHint(widget.targetName),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: () => setState(() {
                      _keyboard = !_keyboard;
                      if (_keyboard) _keyFocus.requestFocus();
                    }),
                    icon: const Icon(Icons.keyboard_rounded, size: 18),
                    style: IconButton.styleFrom(
                        backgroundColor: Colors.black.withValues(alpha: 0.7)),
                  ),
                  const SizedBox(width: 6),
                  IconButton.filled(
                    onPressed: widget.onStop,
                    icon: const Icon(Icons.stop_rounded, size: 18),
                    style: IconButton.styleFrom(
                        backgroundColor: const Color(0xFFD64545)),
                  ),
                ],
              ),
            ),
            if (_keyboard)
              Positioned(
                left: 8,
                right: 8,
                bottom: 8,
                child: Material(
                  color: Colors.black.withValues(alpha: 0.8),
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        TextField(
                          controller: _keyController,
                          focusNode: _keyFocus,
                          autofocus: true,
                          style: const TextStyle(color: Colors.white),
                          onChanged: _onKeyText,
                          decoration: InputDecoration(
                            hintText: l10n.ctlKeyboard,
                            hintStyle: const TextStyle(color: Colors.white54),
                            isDense: true,
                            filled: true,
                            fillColor: Colors.white10,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          children: [
                            _key('⏎', () => _special('Enter', 'Enter')),
                            _key('⌫', () => _special('Backspace', 'Backspace')),
                            _key('Tab', () => _special('Tab', 'Tab')),
                            _key('Esc', () => _special('Escape', 'Escape')),
                            _key('←', () => _special('ArrowLeft', 'ArrowLeft')),
                            _key('→', () => _special('ArrowRight', 'ArrowRight')),
                            _key('↑', () => _special('ArrowUp', 'ArrowUp')),
                            _key('↓', () => _special('ArrowDown', 'ArrowDown')),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        );
      }),
    );
  }

  Widget _key(String label, VoidCallback onTap) => OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white,
          side: const BorderSide(color: Colors.white24),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          minimumSize: Size.zero,
        ),
        child: Text(label),
      );
}
