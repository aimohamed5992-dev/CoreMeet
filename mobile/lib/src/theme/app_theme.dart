import 'package:flutter/material.dart';

/// CoreMeet palette, mirrored from the web design tokens.
class BrandColors {
  const BrandColors._();

  static const brand50 = Color(0xFFE9F9EF);
  static const brand100 = Color(0xFFC9F0D8);
  static const brand300 = Color(0xFF5FD08D);
  static const brand400 = Color(0xFF33BD6C);
  static const brand500 = Color(0xFF1FA84C); // primary
  static const brand600 = Color(0xFF178A3E);
  static const brand700 = Color(0xFF146E33);

  static const danger = Color(0xFFD64545);

  // Light
  static const lightBg = Color(0xFFF7FAF8);
  static const lightSurface = Color(0xFFFFFFFF);
  static const lightSurfaceMuted = Color(0xFFF0F4F2);
  static const lightText = Color(0xFF0D1B12);
  static const lightTextMuted = Color(0xFF667A6F);

  // Dark
  static const darkBg = Color(0xFF0B130E);
  static const darkSurface = Color(0xFF121C15);
  static const darkSurfaceMuted = Color(0xFF18251C);
  static const darkText = Color(0xFFEAF2EC);
  static const darkTextMuted = Color(0xFF9FB2A7);
}

class AppTheme {
  const AppTheme._();

  static ThemeData light() => _base(Brightness.light);
  static ThemeData dark() => _base(Brightness.dark);

  static ThemeData _base(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final bg = isDark ? BrandColors.darkBg : BrandColors.lightBg;
    final surface = isDark ? BrandColors.darkSurface : BrandColors.lightSurface;
    final text = isDark ? BrandColors.darkText : BrandColors.lightText;
    final muted = isDark ? BrandColors.darkTextMuted : BrandColors.lightTextMuted;

    final scheme = ColorScheme(
      brightness: brightness,
      primary: isDark ? BrandColors.brand400 : BrandColors.brand500,
      onPrimary: Colors.white,
      primaryContainer: isDark ? const Color(0xFF14281C) : BrandColors.brand50,
      onPrimaryContainer: isDark ? BrandColors.brand100 : BrandColors.brand700,
      secondary: BrandColors.brand300,
      onSecondary: Colors.black,
      error: BrandColors.danger,
      onError: Colors.white,
      surface: surface,
      onSurface: text,
      surfaceContainerHighest:
          isDark ? BrandColors.darkSurfaceMuted : BrandColors.lightSurfaceMuted,
      outline: isDark ? const Color(0xFF2C3A31) : const Color(0xFFDDE6E0),
    );

    final baseText = ThemeData(brightness: brightness).textTheme.apply(
          bodyColor: text,
          displayColor: text,
        );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: bg,
      canvasColor: bg,
      textTheme: baseText,
      appBarTheme: AppBarTheme(
        backgroundColor: bg,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: baseText.titleLarge?.copyWith(fontWeight: FontWeight.w700),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark
            ? BrandColors.darkSurfaceMuted
            : BrandColors.lightSurfaceMuted,
        hintStyle: TextStyle(color: muted),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: _fieldBorder(scheme.outline),
        enabledBorder: _fieldBorder(scheme.outline),
        focusedBorder: _fieldBorder(scheme.primary, width: 2),
        errorBorder: _fieldBorder(scheme.error),
        focusedErrorBorder: _fieldBorder(scheme.error, width: 2),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: scheme.primary),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: isDark ? BrandColors.darkSurfaceMuted : BrandColors.lightText,
        contentTextStyle: TextStyle(
          color: isDark ? BrandColors.darkText : Colors.white,
        ),
      ),
      dividerColor: scheme.outline,
      extensions: [AppColors(textMuted: muted)],
    );
  }

  static OutlineInputBorder _fieldBorder(Color color, {double width = 1}) =>
      OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: color, width: width),
      );
}

/// Extra semantic colors not covered by [ColorScheme].
@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({required this.textMuted});

  final Color textMuted;

  @override
  AppColors copyWith({Color? textMuted}) =>
      AppColors(textMuted: textMuted ?? this.textMuted);

  @override
  AppColors lerp(AppColors? other, double t) => AppColors(
        textMuted: Color.lerp(textMuted, other?.textMuted, t) ?? textMuted,
      );
}

extension AppColorsX on BuildContext {
  AppColors get colors => Theme.of(this).extension<AppColors>()!;
}
