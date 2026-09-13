import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../meetings/meetings_repository.dart';
import '../../meetings/models/meeting.dart';

/// Meeting details for the lobby, by code.
final lobbyMeetingProvider =
    FutureProvider.autoDispose.family<MeetingDetail, String>(
  (ref, code) => ref.watch(meetingsRepositoryProvider).getByCode(code),
);

/// Device preferences chosen in the lobby, carried into the room.
class LobbyPrefs {
  const LobbyPrefs({this.micOn = true, this.cameraOn = true});
  final bool micOn;
  final bool cameraOn;

  LobbyPrefs copyWith({bool? micOn, bool? cameraOn}) =>
      LobbyPrefs(micOn: micOn ?? this.micOn, cameraOn: cameraOn ?? this.cameraOn);
}

class LobbyPrefsController extends StateNotifier<LobbyPrefs> {
  LobbyPrefsController() : super(const LobbyPrefs());
  void toggleMic() => state = state.copyWith(micOn: !state.micOn);
  void toggleCamera() => state = state.copyWith(cameraOn: !state.cameraOn);
}

/// Not autoDispose: the room reads it right after the lobby is popped.
final lobbyPrefsProvider =
    StateNotifierProvider<LobbyPrefsController, LobbyPrefs>(
  (ref) => LobbyPrefsController(),
);
