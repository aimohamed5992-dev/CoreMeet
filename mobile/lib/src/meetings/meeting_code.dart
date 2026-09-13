final _fromUrl = RegExp(
  r'(?:meeting|join)/([a-z]{3}-[a-z]{4}-[a-z]{3})',
  caseSensitive: false,
);
final _bare = RegExp(r'^[a-z]{3}-?[a-z]{4}-?[a-z]{3}$', caseSensitive: false);

/// Normalises whatever the user pastes (a raw code or a full meeting link)
/// to the `xxx-xxxx-xxx` code form, or null if it can't be one.
String? parseMeetingCode(String input) {
  final trimmed = input.trim();
  if (trimmed.isEmpty) return null;

  final url = _fromUrl.firstMatch(trimmed);
  if (url != null) return url.group(1)!.toLowerCase();

  if (_bare.hasMatch(trimmed)) {
    final letters = trimmed.replaceAll('-', '').toLowerCase();
    return '${letters.substring(0, 3)}-${letters.substring(3, 7)}-${letters.substring(7, 10)}';
  }
  return null;
}
