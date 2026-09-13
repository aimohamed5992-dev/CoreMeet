import 'package:coremeet/src/app.dart';
import 'package:coremeet/src/auth/auth_controller.dart';
import 'package:coremeet/src/features/room/widgets/control_overlay.dart';
import 'package:coremeet/src/localization/locale_controller.dart';
import 'package:coremeet/src/meetings/meetings_repository.dart';
import 'package:coremeet/src/meetings/rtc/room_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Mobile side of the chat + remote-control test. A web peer joins the same
/// meeting, shares its screen, and auto-consents to the control request
/// (see s9-web-peer.mjs / s9-run-both.sh). Needs a backend + agent (dry-run).
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  const pause = int.fromEnvironment('CM_PAUSE', defaultValue: 55);

  testWidgets('chat both ways, then request + drive remote control', (tester) async {
    await const FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
    ).deleteAll();
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final container = ProviderContainer(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
    );
    addTearDown(container.dispose);

    final email = 's9_${DateTime.now().millisecondsSinceEpoch}@t.com';
    await container.read(authControllerProvider.notifier).register(
        name: 'Mobile Controller', email: email, password: 'Password123');
    final code = (await container
            .read(meetingsRepositoryProvider)
            .create(title: 'Control room'))
        .code;
    debugPrint('ROOM_CODE $code');

    await tester.pumpWidget(
      UncontrolledProviderScope(container: container, child: const CloudMeetApp()),
    );
    await tester.pumpAndSettle(const Duration(seconds: 3));

    await tester.enterText(find.byType(TextField).first, code);
    await tester.testTextInput.receiveAction(TextInputAction.go);
    await tester.pumpAndSettle(const Duration(seconds: 3));
    await tester.tap(find.text('Join now'));

    RoomController ctl() =>
        container.read(roomControllerProvider(code).notifier);
    RoomState room() => container.read(roomControllerProvider(code));

    Future<void> settle(int secs) async {
      for (var i = 0; i < secs; i++) {
        await tester.pump(const Duration(seconds: 1));
        await Future<void>.delayed(const Duration(seconds: 1));
      }
    }

    // Wait until connected + the web peer is sharing a screen.
    var presenterCid = '';
    for (var i = 0; i < 40; i++) {
      await settle(1);
      final r = room();
      presenterCid = r.remoteMedia.entries
          .firstWhere((e) => e.value.screen,
              orElse: () => const MapEntry('', RemoteMediaState()))
          .key;
      debugPrint(
          'S9 t=$i phase=${r.phase} feeds=${r.remoteFeeds.length} sharing=$presenterCid msgs=${r.messages.length}');
      if (r.phase == RoomPhase.connected && presenterCid.isNotEmpty) break;
    }
    expect(presenterCid, isNotEmpty, reason: 'web peer never shared a screen');
    debugPrint('S9_SHARING $presenterCid');

    // --- chat: mobile -> web ---
    ctl().sendChat('hello from mobile');
    await settle(3);

    // --- chat: web -> mobile (the web peer sends "hi from web") ---
    var gotWebMsg = false;
    for (var i = 0; i < 20; i++) {
      await settle(1);
      if (room().messages.any((m) => m.content.contains('web'))) {
        gotWebMsg = true;
        break;
      }
    }
    debugPrint('S9_CHAT mineOnMobile=${room().messages.length} gotWeb=$gotWebMsg');
    expect(gotWebMsg, isTrue, reason: 'no chat message from the web peer arrived');

    // --- remote control: request ---
    ctl().requestControl(presenterCid);
    var controlling = false;
    for (var i = 0; i < 25; i++) {
      await settle(1);
      final r = room();
      debugPrint(
          'S9_CTL t=$i state=${r.control.requestState} controlling=${r.control.controlling?.connectionId} denied=${r.control.deniedReason}');
      if (r.control.controlling != null &&
          r.control.requestState == ControlRequestState.idle) {
        controlling = true;
        break;
      }
      if (r.control.requestState == ControlRequestState.denied) break;
    }
    expect(controlling, isTrue,
        reason: 'control was not granted (${room().control.deniedReason})');
    debugPrint('S9_CONTROLLING');

    // The ControlOverlay should now be mounted over the presenter tile.
    await settle(2);
    expect(find.byType(ControlOverlay), findsOneWidget);

    // Drive it: drag across the overlay -> move events relayed to the agent.
    await tester.drag(find.byType(ControlOverlay), const Offset(120, 90));
    await settle(1);
    await tester.tap(find.byType(ControlOverlay));
    await settle(3);
    debugPrint('S9_DROVE events sent');

    // Let the web peer / agent report, then stop.
    await settle(pause);
    ctl().stopControl();
    await settle(2);
    debugPrint('S9_DONE controlling=${room().control.controlling}');
  });
}
