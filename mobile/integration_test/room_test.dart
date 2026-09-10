

import 'package:coremeet/src/app.dart';
import 'package:coremeet/src/auth/auth_controller.dart';
import 'package:coremeet/src/localization/locale_controller.dart';
import 'package:coremeet/src/meetings/meetings_repository.dart';
import 'package:coremeet/src/features/room/widgets/video_tile.dart';
import 'package:coremeet/src/meetings/rtc/room_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// One mobile participant joins a room and stays for [CM_PAUSE] seconds so a
/// web participant can connect over WebRTC. Needs a backend at
/// COREMEET_API_BASE / COREMEET_HUB_URL. If CM_CODE is empty it creates its own
/// meeting (then no remote feed is expected).
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  const givenCode = String.fromEnvironment('CM_CODE');
  const pause = int.fromEnvironment('CM_PAUSE', defaultValue: 40);

  testWidgets('mobile participant joins a live room', (tester) async {
    await const FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
    ).deleteAll();
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final container = ProviderContainer(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
    );
    addTearDown(container.dispose);

    final email = 's8_${DateTime.now().millisecondsSinceEpoch}@t.com';
    await container.read(authControllerProvider.notifier).register(
        name: 'Mobile Peer', email: email, password: 'Password123');

    final code = givenCode.isNotEmpty
        ? givenCode
        : (await container.read(meetingsRepositoryProvider).create(title: 'Mobile room')).code;
    debugPrint('ROOM_CODE $code');

    await tester.pumpWidget(
      UncontrolledProviderScope(container: container, child: const CloudMeetApp()),
    );
    await tester.pumpAndSettle(const Duration(seconds: 3));

    // Dashboard → join by code → lobby.
    await tester.enterText(find.byType(TextField).first, code);
    await tester.testTextInput.receiveAction(TextInputAction.go);
    await tester.pumpAndSettle(const Duration(seconds: 3));
    expect(find.text('Join now'), findsOneWidget);

    await tester.tap(find.text('Join now'));

    String? lastErr;
    var connected = false;
    for (var i = 0; i < 40; i++) {
      await tester.pump(const Duration(seconds: 1));
      await Future<void>.delayed(const Duration(seconds: 1));
      final s = container.read(roomControllerProvider(code));
      lastErr = s.error;
      debugPrint(
          'ROOM_STATE t=$i phase=${s.phase} err=${s.error} feeds=${s.remoteFeeds.length} parts=${s.participants.length} denied=${s.mediaDenied}');
      if (s.phase == RoomPhase.connected) {
        connected = true;
        break;
      }
      if (s.phase == RoomPhase.error) break;
    }
    expect(connected, isTrue, reason: 'never connected: $lastErr');
    debugPrint('ROOM_READY $code');

    var sawRemoteFeed = false;
    var sawTwoTiles = false;
    for (var i = 0; i < pause; i++) {
      await tester.pump(const Duration(seconds: 1));
      await Future<void>.delayed(const Duration(seconds: 1));
      final s = container.read(roomControllerProvider(code));
      final tiles = find.byType(VideoTile).evaluate().length;
      if (s.remoteFeeds.isNotEmpty) sawRemoteFeed = true;
      if (tiles >= 2) sawTwoTiles = true;
      if (i % 5 == 0) {
        debugPrint('ROOM_HOLD t=$i feeds=${s.remoteFeeds.length} tiles=$tiles');
      }
    }

    final s = container.read(roomControllerProvider(code));
    debugPrint('ROOM_DONE sawFeed=$sawRemoteFeed sawTiles=$sawTwoTiles parts=${s.participants.length}');
    // A remote participant joined at some point during the hold.
    expect(sawRemoteFeed, isTrue, reason: 'no remote WebRTC feed ever arrived');
    expect(sawTwoTiles, isTrue, reason: 'a second video tile never rendered');
  });
}
