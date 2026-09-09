import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of L
/// returned by `L.of(context)`.
///
/// Applications need to include `L.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: L.localizationsDelegates,
///   supportedLocales: L.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the L.supportedLocales
/// property.
abstract class L {
  L(String locale) : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static L of(BuildContext context) {
    return Localizations.of<L>(context, L)!;
  }

  static const LocalizationsDelegate<L> delegate = _LDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates = <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en')
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'CoreMeet'**
  String get appName;

  /// No description provided for @langName.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get langName;

  /// No description provided for @switchToArabic.
  ///
  /// In en, this message translates to:
  /// **'العربية'**
  String get switchToArabic;

  /// No description provided for @switchToEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get switchToEnglish;

  /// No description provided for @commonContinue.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get commonContinue;

  /// No description provided for @commonCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get commonCancel;

  /// No description provided for @commonRetry.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get commonRetry;

  /// No description provided for @commonEmail.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get commonEmail;

  /// No description provided for @commonPassword.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get commonPassword;

  /// No description provided for @commonName.
  ///
  /// In en, this message translates to:
  /// **'Full name'**
  String get commonName;

  /// No description provided for @commonLoading.
  ///
  /// In en, this message translates to:
  /// **'Loading…'**
  String get commonLoading;

  /// No description provided for @commonShow.
  ///
  /// In en, this message translates to:
  /// **'Show'**
  String get commonShow;

  /// No description provided for @commonHide.
  ///
  /// In en, this message translates to:
  /// **'Hide'**
  String get commonHide;

  /// No description provided for @splashTagline.
  ///
  /// In en, this message translates to:
  /// **'Meetings that just work.'**
  String get splashTagline;

  /// No description provided for @authWelcomeTitle.
  ///
  /// In en, this message translates to:
  /// **'Meet without the friction'**
  String get authWelcomeTitle;

  /// No description provided for @authWelcomePoint1.
  ///
  /// In en, this message translates to:
  /// **'HD video with up to 12 people in the room'**
  String get authWelcomePoint1;

  /// No description provided for @authWelcomePoint2.
  ///
  /// In en, this message translates to:
  /// **'Share your screen and hand over control'**
  String get authWelcomePoint2;

  /// No description provided for @authWelcomePoint3.
  ///
  /// In en, this message translates to:
  /// **'Chat, raise a hand, and manage the room'**
  String get authWelcomePoint3;

  /// No description provided for @loginTitle.
  ///
  /// In en, this message translates to:
  /// **'Welcome back'**
  String get loginTitle;

  /// No description provided for @loginSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in to start or join a meeting.'**
  String get loginSubtitle;

  /// No description provided for @loginCta.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get loginCta;

  /// No description provided for @loginNoAccount.
  ///
  /// In en, this message translates to:
  /// **'New to CoreMeet?'**
  String get loginNoAccount;

  /// No description provided for @loginCreateAccount.
  ///
  /// In en, this message translates to:
  /// **'Create an account'**
  String get loginCreateAccount;

  /// No description provided for @registerTitle.
  ///
  /// In en, this message translates to:
  /// **'Create your account'**
  String get registerTitle;

  /// No description provided for @registerSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Free to start. No card needed.'**
  String get registerSubtitle;

  /// No description provided for @registerCta.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get registerCta;

  /// No description provided for @registerHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account?'**
  String get registerHaveAccount;

  /// No description provided for @registerSignIn.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get registerSignIn;

  /// No description provided for @passwordHint.
  ///
  /// In en, this message translates to:
  /// **'At least 8 characters'**
  String get passwordHint;

  /// No description provided for @validationEmailRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter your email'**
  String get validationEmailRequired;

  /// No description provided for @validationEmailInvalid.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email'**
  String get validationEmailInvalid;

  /// No description provided for @validationPasswordRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter your password'**
  String get validationPasswordRequired;

  /// No description provided for @validationPasswordShort.
  ///
  /// In en, this message translates to:
  /// **'Password must be at least 8 characters'**
  String get validationPasswordShort;

  /// No description provided for @validationNameRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter your name'**
  String get validationNameRequired;

  /// No description provided for @errorInvalidCredentials.
  ///
  /// In en, this message translates to:
  /// **'Invalid email or password.'**
  String get errorInvalidCredentials;

  /// No description provided for @errorEmailExists.
  ///
  /// In en, this message translates to:
  /// **'An account with this email already exists.'**
  String get errorEmailExists;

  /// No description provided for @errorNetwork.
  ///
  /// In en, this message translates to:
  /// **'Can’t reach CoreMeet. Check your connection.'**
  String get errorNetwork;

  /// No description provided for @errorGeneric.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again.'**
  String get errorGeneric;

  /// No description provided for @errorSignInFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not sign you in.'**
  String get errorSignInFailed;

  /// No description provided for @errorCreateFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not create your account.'**
  String get errorCreateFailed;

  /// No description provided for @dashGreetingMorning.
  ///
  /// In en, this message translates to:
  /// **'Good morning'**
  String get dashGreetingMorning;

  /// No description provided for @dashGreetingAfternoon.
  ///
  /// In en, this message translates to:
  /// **'Good afternoon'**
  String get dashGreetingAfternoon;

  /// No description provided for @dashGreetingEvening.
  ///
  /// In en, this message translates to:
  /// **'Good evening'**
  String get dashGreetingEvening;

  /// No description provided for @dashGreetingLine.
  ///
  /// In en, this message translates to:
  /// **'{greeting}, {name}'**
  String dashGreetingLine(Object greeting, Object name);

  /// No description provided for @dashNewMeeting.
  ///
  /// In en, this message translates to:
  /// **'New meeting'**
  String get dashNewMeeting;

  /// No description provided for @dashNewMeetingHint.
  ///
  /// In en, this message translates to:
  /// **'Start an instant meeting and invite people'**
  String get dashNewMeetingHint;

  /// No description provided for @dashStarting.
  ///
  /// In en, this message translates to:
  /// **'Starting…'**
  String get dashStarting;

  /// No description provided for @dashRecent.
  ///
  /// In en, this message translates to:
  /// **'Recent meetings'**
  String get dashRecent;

  /// No description provided for @dashRecentEmpty.
  ///
  /// In en, this message translates to:
  /// **'Meetings you start or join will show up here.'**
  String get dashRecentEmpty;

  /// No description provided for @dashRefresh.
  ///
  /// In en, this message translates to:
  /// **'Pull to refresh'**
  String get dashRefresh;

  /// No description provided for @dashOpenProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get dashOpenProfile;

  /// No description provided for @dashSignOut.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get dashSignOut;

  /// No description provided for @dashErrorLoad.
  ///
  /// In en, this message translates to:
  /// **'Couldn’t load your meetings.'**
  String get dashErrorLoad;

  /// No description provided for @dashNewMeetingTitle.
  ///
  /// In en, this message translates to:
  /// **'New meeting'**
  String get dashNewMeetingTitle;

  /// No description provided for @joinTitle.
  ///
  /// In en, this message translates to:
  /// **'Join a meeting'**
  String get joinTitle;

  /// No description provided for @joinPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Enter a code or link'**
  String get joinPlaceholder;

  /// No description provided for @joinCta.
  ///
  /// In en, this message translates to:
  /// **'Join'**
  String get joinCta;

  /// No description provided for @joinInvalidCode.
  ///
  /// In en, this message translates to:
  /// **'That doesn’t look like a meeting code.'**
  String get joinInvalidCode;

  /// No description provided for @joinNotFound.
  ///
  /// In en, this message translates to:
  /// **'No meeting found for that code.'**
  String get joinNotFound;

  /// No description provided for @meetingStatusActive.
  ///
  /// In en, this message translates to:
  /// **'Live now'**
  String get meetingStatusActive;

  /// No description provided for @meetingStatusScheduled.
  ///
  /// In en, this message translates to:
  /// **'Not started'**
  String get meetingStatusScheduled;

  /// No description provided for @meetingStatusEnded.
  ///
  /// In en, this message translates to:
  /// **'Ended'**
  String get meetingStatusEnded;

  /// No description provided for @meetingPeople.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No one yet} =1{1 person} other{{count} people}}'**
  String meetingPeople(int count);

  /// No description provided for @meetingHostedBy.
  ///
  /// In en, this message translates to:
  /// **'Hosted by {name}'**
  String meetingHostedBy(Object name);

  /// No description provided for @lobbyGettingReady.
  ///
  /// In en, this message translates to:
  /// **'Getting things ready…'**
  String get lobbyGettingReady;

  /// No description provided for @lobbyReadyToJoin.
  ///
  /// In en, this message translates to:
  /// **'Ready to join?'**
  String get lobbyReadyToJoin;

  /// No description provided for @lobbyFirstHere.
  ///
  /// In en, this message translates to:
  /// **'You’re the first one here'**
  String get lobbyFirstHere;

  /// No description provided for @lobbyOnePersonIn.
  ///
  /// In en, this message translates to:
  /// **'1 person is in the meeting'**
  String get lobbyOnePersonIn;

  /// No description provided for @lobbyPeopleIn.
  ///
  /// In en, this message translates to:
  /// **'{count} people are in the meeting'**
  String lobbyPeopleIn(int count);

  /// No description provided for @lobbyCameraOn.
  ///
  /// In en, this message translates to:
  /// **'Camera on'**
  String get lobbyCameraOn;

  /// No description provided for @lobbyCameraOff.
  ///
  /// In en, this message translates to:
  /// **'Camera off'**
  String get lobbyCameraOff;

  /// No description provided for @lobbyMicOn.
  ///
  /// In en, this message translates to:
  /// **'Mic on'**
  String get lobbyMicOn;

  /// No description provided for @lobbyMicOff.
  ///
  /// In en, this message translates to:
  /// **'Mic off'**
  String get lobbyMicOff;

  /// No description provided for @lobbyJoinNow.
  ///
  /// In en, this message translates to:
  /// **'Join now'**
  String get lobbyJoinNow;

  /// No description provided for @lobbyJoining.
  ///
  /// In en, this message translates to:
  /// **'Joining…'**
  String get lobbyJoining;

  /// No description provided for @lobbyLeave.
  ///
  /// In en, this message translates to:
  /// **'Leave'**
  String get lobbyLeave;

  /// No description provided for @lobbyEnded.
  ///
  /// In en, this message translates to:
  /// **'This meeting has ended.'**
  String get lobbyEnded;

  /// No description provided for @lobbyNotFoundTitle.
  ///
  /// In en, this message translates to:
  /// **'Meeting not found'**
  String get lobbyNotFoundTitle;

  /// No description provided for @lobbyNotFoundText.
  ///
  /// In en, this message translates to:
  /// **'Double-check the code or ask the host for a new link.'**
  String get lobbyNotFoundText;

  /// No description provided for @lobbyCameraNote.
  ///
  /// In en, this message translates to:
  /// **'The camera preview and audio start in the meeting.'**
  String get lobbyCameraNote;

  /// No description provided for @roomShareCode.
  ///
  /// In en, this message translates to:
  /// **'Share code'**
  String get roomShareCode;

  /// No description provided for @roomCopied.
  ///
  /// In en, this message translates to:
  /// **'Code copied'**
  String get roomCopied;

  /// No description provided for @roomLeave.
  ///
  /// In en, this message translates to:
  /// **'Leave meeting'**
  String get roomLeave;

  /// No description provided for @roomConnecting.
  ///
  /// In en, this message translates to:
  /// **'Connecting…'**
  String get roomConnecting;

  /// No description provided for @roomReconnecting.
  ///
  /// In en, this message translates to:
  /// **'Reconnecting…'**
  String get roomReconnecting;

  /// No description provided for @roomDisconnected.
  ///
  /// In en, this message translates to:
  /// **'Disconnected'**
  String get roomDisconnected;

  /// No description provided for @roomLive.
  ///
  /// In en, this message translates to:
  /// **'Live'**
  String get roomLive;

  /// No description provided for @roomYouParen.
  ///
  /// In en, this message translates to:
  /// **' (You)'**
  String get roomYouParen;

  /// No description provided for @roomMicTitle.
  ///
  /// In en, this message translates to:
  /// **'Microphone'**
  String get roomMicTitle;

  /// No description provided for @roomCamTitle.
  ///
  /// In en, this message translates to:
  /// **'Camera'**
  String get roomCamTitle;

  /// No description provided for @roomFlipTitle.
  ///
  /// In en, this message translates to:
  /// **'Flip camera'**
  String get roomFlipTitle;

  /// No description provided for @roomLeaveTitle.
  ///
  /// In en, this message translates to:
  /// **'Leave'**
  String get roomLeaveTitle;

  /// No description provided for @roomPeopleTitle.
  ///
  /// In en, this message translates to:
  /// **'People'**
  String get roomPeopleTitle;

  /// No description provided for @roomLeaveConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Leave the meeting?'**
  String get roomLeaveConfirmTitle;

  /// No description provided for @roomLeaveConfirmBody.
  ///
  /// In en, this message translates to:
  /// **'You can rejoin any time with the same code.'**
  String get roomLeaveConfirmBody;

  /// No description provided for @roomStay.
  ///
  /// In en, this message translates to:
  /// **'Stay'**
  String get roomStay;

  /// No description provided for @roomCantJoinTitle.
  ///
  /// In en, this message translates to:
  /// **'Can’t join this meeting'**
  String get roomCantJoinTitle;

  /// No description provided for @roomCantJoinText.
  ///
  /// In en, this message translates to:
  /// **'The meeting may have ended or the link is invalid.'**
  String get roomCantJoinText;

  /// No description provided for @roomMediaBlocked.
  ///
  /// In en, this message translates to:
  /// **'Camera and mic are blocked. You can still see and hear others.'**
  String get roomMediaBlocked;

  /// No description provided for @roomAlone.
  ///
  /// In en, this message translates to:
  /// **'Waiting for others to join. Share the code {code}.'**
  String roomAlone(Object code);

  /// No description provided for @roomParticipants.
  ///
  /// In en, this message translates to:
  /// **'In this meeting'**
  String get roomParticipants;

  /// No description provided for @roomChatTitle.
  ///
  /// In en, this message translates to:
  /// **'Chat'**
  String get roomChatTitle;

  /// No description provided for @roomHost.
  ///
  /// In en, this message translates to:
  /// **'Host'**
  String get roomHost;

  /// No description provided for @roomOffline.
  ///
  /// In en, this message translates to:
  /// **'Offline'**
  String get roomOffline;

  /// No description provided for @roomYou.
  ///
  /// In en, this message translates to:
  /// **'You'**
  String get roomYou;

  /// No description provided for @roomEndForAll.
  ///
  /// In en, this message translates to:
  /// **'End for everyone'**
  String get roomEndForAll;

  /// No description provided for @roomEndConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'End the meeting?'**
  String get roomEndConfirmTitle;

  /// No description provided for @roomEndConfirmBody.
  ///
  /// In en, this message translates to:
  /// **'This ends the meeting for everyone.'**
  String get roomEndConfirmBody;

  /// No description provided for @roomEnd.
  ///
  /// In en, this message translates to:
  /// **'End meeting'**
  String get roomEnd;

  /// No description provided for @roomPresenting.
  ///
  /// In en, this message translates to:
  /// **'Presenting'**
  String get roomPresenting;

  /// No description provided for @chatTitle.
  ///
  /// In en, this message translates to:
  /// **'Chat'**
  String get chatTitle;

  /// No description provided for @chatEmpty.
  ///
  /// In en, this message translates to:
  /// **'No messages yet. Say hello 👋'**
  String get chatEmpty;

  /// No description provided for @chatPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Message everyone'**
  String get chatPlaceholder;

  /// No description provided for @ctlRequest.
  ///
  /// In en, this message translates to:
  /// **'Request control'**
  String get ctlRequest;

  /// No description provided for @ctlRequesting.
  ///
  /// In en, this message translates to:
  /// **'Waiting for approval…'**
  String get ctlRequesting;

  /// No description provided for @ctlRequestTitle.
  ///
  /// In en, this message translates to:
  /// **'Control request'**
  String get ctlRequestTitle;

  /// No description provided for @ctlRequestBody.
  ///
  /// In en, this message translates to:
  /// **'{name} wants to control your shared screen.'**
  String ctlRequestBody(Object name);

  /// No description provided for @ctlAllow.
  ///
  /// In en, this message translates to:
  /// **'Allow'**
  String get ctlAllow;

  /// No description provided for @ctlDeny.
  ///
  /// In en, this message translates to:
  /// **'Deny'**
  String get ctlDeny;

  /// No description provided for @ctlStop.
  ///
  /// In en, this message translates to:
  /// **'Stop'**
  String get ctlStop;

  /// No description provided for @ctlControlledBy.
  ///
  /// In en, this message translates to:
  /// **'{name} is controlling your screen'**
  String ctlControlledBy(Object name);

  /// No description provided for @ctlControllingHint.
  ///
  /// In en, this message translates to:
  /// **'Controlling {name} — tap the stop button to release'**
  String ctlControllingHint(Object name);

  /// No description provided for @ctlKeyboard.
  ///
  /// In en, this message translates to:
  /// **'Keyboard'**
  String get ctlKeyboard;

  /// No description provided for @ctlDeniedBusy.
  ///
  /// In en, this message translates to:
  /// **'Someone else is already controlling'**
  String get ctlDeniedBusy;

  /// No description provided for @ctlDeniedNotSharing.
  ///
  /// In en, this message translates to:
  /// **'They stopped sharing their screen'**
  String get ctlDeniedNotSharing;

  /// No description provided for @ctlDeniedDenied.
  ///
  /// In en, this message translates to:
  /// **'Request declined'**
  String get ctlDeniedDenied;

  /// No description provided for @ctlAndroidTargetNote.
  ///
  /// In en, this message translates to:
  /// **'Being controlled from another device needs the CoreMeet accessibility service (Android). iOS can’t be controlled.'**
  String get ctlAndroidTargetNote;
}

class _LDelegate extends LocalizationsDelegate<L> {
  const _LDelegate();

  @override
  Future<L> load(Locale locale) {
    return SynchronousFuture<L>(lookupL(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>['ar', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_LDelegate old) => false;
}

L lookupL(Locale locale) {


  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar': return LAr();
    case 'en': return LEn();
  }

  throw FlutterError(
    'L.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.'
  );
}
