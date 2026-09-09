import 'package:flutter/material.dart';

import '../../localization/l10n_ext.dart';
import '../../theme/app_theme.dart';
import '../../widgets/brand_logo.dart';

/// Shown while the auth state resolves on cold start.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const BrandLogo(size: 44),
            const SizedBox(height: 20),
            Text(
              context.l10n.splashTagline,
              style: TextStyle(color: context.colors.textMuted),
            ),
            const SizedBox(height: 28),
            const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2.4),
            ),
          ],
        ),
      ),
    );
  }
}
