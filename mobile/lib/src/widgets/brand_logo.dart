import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Cloud Meet wordmark: the logo asset plus the name.
class BrandLogo extends StatelessWidget {
  const BrandLogo({super.key, this.size = 28, this.showName = true});

  final double size;
  final bool showName;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(size * 0.28),
          child: Image.asset('assets/logo.png', width: size, height: size),
        ),
        if (showName) ...[
          SizedBox(width: size * 0.32),
          Text(
            'Cloud Meet',
            style: TextStyle(
              fontSize: size * 0.66,
              fontWeight: FontWeight.w700,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ],
      ],
    );
  }
}

/// Round monogram avatar with the user's brand colour.
class BrandAvatar extends StatelessWidget {
  const BrandAvatar({
    super.key,
    required this.name,
    required this.colorHex,
    this.imageUrl,
    this.size = 40,
  });

  final String name;
  final String colorHex;
  final String? imageUrl;
  final double size;

  @override
  Widget build(BuildContext context) {
    final bg = _parseHex(colorHex) ?? BrandColors.brand500;
    final initial = name.trim().isEmpty ? '?' : name.trim()[0].toUpperCase();

    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: bg,
        shape: BoxShape.circle,
        image: imageUrl != null && imageUrl!.isNotEmpty
            ? DecorationImage(image: NetworkImage(imageUrl!), fit: BoxFit.cover)
            : null,
      ),
      child: imageUrl != null && imageUrl!.isNotEmpty
          ? null
          : Text(
              initial,
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: size * 0.42,
              ),
            ),
    );
  }

  static Color? _parseHex(String hex) {
    var v = hex.replaceFirst('#', '').trim();
    if (v.length == 6) v = 'FF$v';
    final n = int.tryParse(v, radix: 16);
    return n == null ? null : Color(n);
  }
}
