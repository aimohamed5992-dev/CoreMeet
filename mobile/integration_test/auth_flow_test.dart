import 'package:coremeet/src/app.dart';
import 'package:coremeet/src/localization/locale_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Needs the backend reachable at the --dart-define'd COREMEET_API_BASE.
///
/// Pass --dart-define=CM_PAUSE=6 to hold each screen for N seconds so an
/// external screenshot tool (xcrun simctl io screenshot) can capture it.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  const pauseSecs = int.fromEnvironment('CM_PAUSE', defaultValue: 0);
  Future<void> hold() =>
      pauseSecs == 0 ? Future.value() : Future.delayed(Duration(seconds: pauseSecs));

  testWidgets('language toggle flips to RTL, then register lands on home',
      (tester) async {
    // Start from a signed-out state — secure storage is the real keychain here.
    await const FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
    ).deleteAll();
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
        child: const CoreMeetApp(),
      ),
    );
    await tester.pumpAndSettle(const Duration(seconds: 2));

    // Login screen — English, LTR.
    expect(find.text('Welcome back'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('Welcome back'))),
        TextDirection.ltr);

    // Flip to Arabic → RTL.
    await tester.tap(find.text('العربية'));
    await tester.pumpAndSettle(const Duration(seconds: 1));
    expect(find.text('مرحبًا بعودتك'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('مرحبًا بعودتك'))),
        TextDirection.rtl);
    await hold();

    // Register (Arabic).
    await tester.tap(find.text('أنشئ حسابًا'));
    await tester.pumpAndSettle(const Duration(seconds: 1));
    expect(find.text('أنشئ حسابك'), findsOneWidget);
    await hold();

    final email = 'm6_${DateTime.now().millisecondsSinceEpoch}@t.com';
    await tester.enterText(find.byType(TextFormField).at(0), 'مستخدم الاختبار');
    await tester.enterText(find.byType(TextFormField).at(1), email);
    await tester.enterText(find.byType(TextFormField).at(2), 'Password123');
    await tester.pumpAndSettle();

    final submit = find.text('إنشاء حساب');
    await tester.ensureVisible(submit);
    await tester.pumpAndSettle();
    await tester.tap(submit);
    await tester.pumpAndSettle(const Duration(seconds: 8));

    // Authenticated dashboard.
    expect(find.text('اجتماع جديد'), findsOneWidget);
    await hold();
  });
}
