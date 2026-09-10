import 'package:coremeet/src/app.dart';
import 'package:coremeet/src/auth/auth_controller.dart';
import 'package:coremeet/src/localization/locale_controller.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Needs the backend at --dart-define=COREMEET_API_BASE.
/// --dart-define=CM_PAUSE=N holds each screen for screenshots.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  const pause = int.fromEnvironment('CM_PAUSE', defaultValue: 0);
  Future<void> hold() =>
      pause == 0 ? Future.value() : Future.delayed(Duration(seconds: pause));

  testWidgets('dashboard → new meeting → lobby → join → room', (tester) async {
    await const FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
    ).deleteAll();
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final container = ProviderContainer(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
    );
    addTearDown(container.dispose);

    // Sign up straight through the controller so the test focuses on meetings.
    final email = 'm7_${DateTime.now().millisecondsSinceEpoch}@t.com';
    await container.read(authControllerProvider.notifier).register(
          name: 'Meeting Tester',
          email: email,
          password: 'Password123',
        );

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const CloudMeetApp(),
      ),
    );
    await tester.pumpAndSettle(const Duration(seconds: 3));

    // Dashboard.
    expect(find.text('New meeting'), findsOneWidget);
    expect(find.text('Join a meeting'), findsOneWidget);
    await hold();

    // Start an instant meeting → lands in the lobby.
    await tester.tap(find.text('New meeting'));
    await tester.pumpAndSettle(const Duration(seconds: 6));
    expect(find.text('Join now'), findsOneWidget);
    await hold();

    // Join → room placeholder.
    await tester.tap(find.text('Join now'));
    await tester.pumpAndSettle(const Duration(seconds: 6));
    expect(find.text('Meeting room'), findsOneWidget);
    await hold();

    // Leave → back to a dashboard that now lists the meeting.
    await tester.tap(find.text('Leave meeting'));
    await tester.pumpAndSettle(const Duration(seconds: 4));
    expect(find.text('Recent meetings'), findsOneWidget);
    expect(find.text('Live now'), findsWidgets);
    await hold();
  });
}
