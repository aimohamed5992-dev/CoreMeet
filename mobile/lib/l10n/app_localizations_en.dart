// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class LEn extends L {
  LEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'CoreMeet';

  @override
  String get langName => 'English';

  @override
  String get switchToArabic => 'العربية';

  @override
  String get switchToEnglish => 'English';

  @override
  String get commonContinue => 'Continue';

  @override
  String get commonCancel => 'Cancel';

  @override
  String get commonRetry => 'Try again';

  @override
  String get commonEmail => 'Email';

  @override
  String get commonPassword => 'Password';

  @override
  String get commonName => 'Full name';

  @override
  String get commonLoading => 'Loading…';

  @override
  String get commonShow => 'Show';

  @override
  String get commonHide => 'Hide';

  @override
  String get splashTagline => 'Meetings that just work.';

  @override
  String get authWelcomeTitle => 'Meet without the friction';

  @override
  String get authWelcomePoint1 => 'HD video with up to 12 people in the room';

  @override
  String get authWelcomePoint2 => 'Share your screen and hand over control';

  @override
  String get authWelcomePoint3 => 'Chat, raise a hand, and manage the room';

  @override
  String get loginTitle => 'Welcome back';

  @override
  String get loginSubtitle => 'Sign in to start or join a meeting.';

  @override
  String get loginCta => 'Sign in';

  @override
  String get loginNoAccount => 'New to CoreMeet?';

  @override
  String get loginCreateAccount => 'Create an account';

  @override
  String get registerTitle => 'Create your account';

  @override
  String get registerSubtitle => 'Free to start. No card needed.';

  @override
  String get registerCta => 'Create account';

  @override
  String get registerHaveAccount => 'Already have an account?';

  @override
  String get registerSignIn => 'Sign in';

  @override
  String get passwordHint => 'At least 8 characters';

  @override
  String get validationEmailRequired => 'Enter your email';

  @override
  String get validationEmailInvalid => 'Enter a valid email';

  @override
  String get validationPasswordRequired => 'Enter your password';

  @override
  String get validationPasswordShort => 'Password must be at least 8 characters';

  @override
  String get validationNameRequired => 'Enter your name';

  @override
  String get errorInvalidCredentials => 'Invalid email or password.';

  @override
  String get errorEmailExists => 'An account with this email already exists.';

  @override
  String get errorNetwork => 'Can’t reach CoreMeet. Check your connection.';

  @override
  String get errorGeneric => 'Something went wrong. Please try again.';

  @override
  String get errorSignInFailed => 'Could not sign you in.';

  @override
  String get errorCreateFailed => 'Could not create your account.';

  @override
  String get dashGreetingMorning => 'Good morning';

  @override
  String get dashGreetingAfternoon => 'Good afternoon';

  @override
  String get dashGreetingEvening => 'Good evening';

  @override
  String dashGreetingLine(Object greeting, Object name) {
    return '$greeting, $name';
  }

  @override
  String get dashNewMeeting => 'New meeting';

  @override
  String get dashNewMeetingHint => 'Start an instant meeting and invite people';

  @override
  String get dashStarting => 'Starting…';

  @override
  String get dashRecent => 'Recent meetings';

  @override
  String get dashRecentEmpty => 'Meetings you start or join will show up here.';

  @override
  String get dashRefresh => 'Pull to refresh';

  @override
  String get dashOpenProfile => 'Profile';

  @override
  String get dashSignOut => 'Sign out';

  @override
  String get dashErrorLoad => 'Couldn’t load your meetings.';

  @override
  String get dashNewMeetingTitle => 'New meeting';

  @override
  String get joinTitle => 'Join a meeting';

  @override
  String get joinPlaceholder => 'Enter a code or link';

  @override
  String get joinCta => 'Join';

  @override
  String get joinInvalidCode => 'That doesn’t look like a meeting code.';

  @override
  String get joinNotFound => 'No meeting found for that code.';

  @override
  String get meetingStatusActive => 'Live now';

  @override
  String get meetingStatusScheduled => 'Not started';

  @override
  String get meetingStatusEnded => 'Ended';

  @override
  String meetingPeople(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count people',
      one: '1 person',
      zero: 'No one yet',
    );
    return '$_temp0';
  }

  @override
  String meetingHostedBy(Object name) {
    return 'Hosted by $name';
  }

  @override
  String get lobbyGettingReady => 'Getting things ready…';

  @override
  String get lobbyReadyToJoin => 'Ready to join?';

  @override
  String get lobbyFirstHere => 'You’re the first one here';

  @override
  String get lobbyOnePersonIn => '1 person is in the meeting';

  @override
  String lobbyPeopleIn(int count) {
    return '$count people are in the meeting';
  }

  @override
  String get lobbyCameraOn => 'Camera on';

  @override
  String get lobbyCameraOff => 'Camera off';

  @override
  String get lobbyMicOn => 'Mic on';

  @override
  String get lobbyMicOff => 'Mic off';

  @override
  String get lobbyJoinNow => 'Join now';

  @override
  String get lobbyJoining => 'Joining…';

  @override
  String get lobbyLeave => 'Leave';

  @override
  String get lobbyEnded => 'This meeting has ended.';

  @override
  String get lobbyNotFoundTitle => 'Meeting not found';

  @override
  String get lobbyNotFoundText => 'Double-check the code or ask the host for a new link.';

  @override
  String get lobbyCameraNote => 'The camera preview and audio start in the meeting.';

  @override
  String get roomShareCode => 'Share code';

  @override
  String get roomCopied => 'Code copied';

  @override
  String get roomLeave => 'Leave meeting';

  @override
  String get roomConnecting => 'Connecting…';

  @override
  String get roomReconnecting => 'Reconnecting…';

  @override
  String get roomDisconnected => 'Disconnected';

  @override
  String get roomLive => 'Live';

  @override
  String get roomYouParen => ' (You)';

  @override
  String get roomMicTitle => 'Microphone';

  @override
  String get roomCamTitle => 'Camera';

  @override
  String get roomFlipTitle => 'Flip camera';

  @override
  String get roomLeaveTitle => 'Leave';

  @override
  String get roomPeopleTitle => 'People';

  @override
  String get roomLeaveConfirmTitle => 'Leave the meeting?';

  @override
  String get roomLeaveConfirmBody => 'You can rejoin any time with the same code.';

  @override
  String get roomStay => 'Stay';

  @override
  String get roomCantJoinTitle => 'Can’t join this meeting';

  @override
  String get roomCantJoinText => 'The meeting may have ended or the link is invalid.';

  @override
  String get roomMediaBlocked => 'Camera and mic are blocked. You can still see and hear others.';

  @override
  String roomAlone(Object code) {
    return 'Waiting for others to join. Share the code $code.';
  }

  @override
  String get roomParticipants => 'In this meeting';

  @override
  String get roomChatTitle => 'Chat';

  @override
  String get roomHost => 'Host';

  @override
  String get roomOffline => 'Offline';

  @override
  String get roomYou => 'You';

  @override
  String get roomEndForAll => 'End for everyone';

  @override
  String get roomEndConfirmTitle => 'End the meeting?';

  @override
  String get roomEndConfirmBody => 'This ends the meeting for everyone.';

  @override
  String get roomEnd => 'End meeting';

  @override
  String get roomPresenting => 'Presenting';

  @override
  String get chatTitle => 'Chat';

  @override
  String get chatEmpty => 'No messages yet. Say hello 👋';

  @override
  String get chatPlaceholder => 'Message everyone';

  @override
  String get ctlRequest => 'Request control';

  @override
  String get ctlRequesting => 'Waiting for approval…';

  @override
  String get ctlRequestTitle => 'Control request';

  @override
  String ctlRequestBody(Object name) {
    return '$name wants to control your shared screen.';
  }

  @override
  String get ctlAllow => 'Allow';

  @override
  String get ctlDeny => 'Deny';

  @override
  String get ctlStop => 'Stop';

  @override
  String ctlControlledBy(Object name) {
    return '$name is controlling your screen';
  }

  @override
  String ctlControllingHint(Object name) {
    return 'Controlling $name — tap the stop button to release';
  }

  @override
  String get ctlKeyboard => 'Keyboard';

  @override
  String get ctlDeniedBusy => 'Someone else is already controlling';

  @override
  String get ctlDeniedNotSharing => 'They stopped sharing their screen';

  @override
  String get ctlDeniedDenied => 'Request declined';

  @override
  String get ctlAndroidTargetNote => 'Being controlled from another device needs the CoreMeet accessibility service (Android). iOS can’t be controlled.';
}
