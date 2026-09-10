// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class LAr extends L {
  LAr([String locale = 'ar']) : super(locale);

  @override
  String get appName => 'كلاود ميت';

  @override
  String get langName => 'العربية';

  @override
  String get switchToArabic => 'العربية';

  @override
  String get switchToEnglish => 'English';

  @override
  String get commonContinue => 'متابعة';

  @override
  String get commonCancel => 'إلغاء';

  @override
  String get commonRetry => 'إعادة المحاولة';

  @override
  String get commonEmail => 'البريد الإلكتروني';

  @override
  String get commonPassword => 'كلمة المرور';

  @override
  String get commonName => 'الاسم الكامل';

  @override
  String get commonLoading => 'جارٍ التحميل…';

  @override
  String get commonShow => 'إظهار';

  @override
  String get commonHide => 'إخفاء';

  @override
  String get splashTagline => 'اجتماعات تشتغل ببساطة.';

  @override
  String get authWelcomeTitle => 'اجتمعوا بدون تعقيد';

  @override
  String get authWelcomePoint1 => 'فيديو عالي الدقة حتى ١٢ شخصًا في الغرفة';

  @override
  String get authWelcomePoint2 => 'شارِك شاشتك وسلّم التحكّم فيها';

  @override
  String get authWelcomePoint3 => 'محادثة ورفع يد وإدارة كاملة للغرفة';

  @override
  String get loginTitle => 'مرحبًا بعودتك';

  @override
  String get loginSubtitle => 'سجّل الدخول لبدء اجتماع أو الانضمام إليه.';

  @override
  String get loginCta => 'تسجيل الدخول';

  @override
  String get loginNoAccount => 'جديد على كلاود ميت؟';

  @override
  String get loginCreateAccount => 'أنشئ حسابًا';

  @override
  String get registerTitle => 'أنشئ حسابك';

  @override
  String get registerSubtitle => 'ابدأ مجانًا. بدون بطاقة.';

  @override
  String get registerCta => 'إنشاء حساب';

  @override
  String get registerHaveAccount => 'لديك حساب بالفعل؟';

  @override
  String get registerSignIn => 'تسجيل الدخول';

  @override
  String get passwordHint => '٨ أحرف على الأقل';

  @override
  String get validationEmailRequired => 'أدخل بريدك الإلكتروني';

  @override
  String get validationEmailInvalid => 'أدخل بريدًا إلكترونيًا صحيحًا';

  @override
  String get validationPasswordRequired => 'أدخل كلمة المرور';

  @override
  String get validationPasswordShort => 'يجب أن تكون كلمة المرور ٨ أحرف على الأقل';

  @override
  String get validationNameRequired => 'أدخل اسمك';

  @override
  String get errorInvalidCredentials => 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';

  @override
  String get errorEmailExists => 'يوجد حساب بهذا البريد الإلكتروني بالفعل.';

  @override
  String get errorNetwork => 'تعذّر الوصول إلى كلاود ميت. تحقّق من اتصالك.';

  @override
  String get errorGeneric => 'حدث خطأ ما. من فضلك حاول مجددًا.';

  @override
  String get errorSignInFailed => 'تعذّر تسجيل دخولك.';

  @override
  String get errorCreateFailed => 'تعذّر إنشاء حسابك.';

  @override
  String get dashGreetingMorning => 'صباح الخير';

  @override
  String get dashGreetingAfternoon => 'مساء الخير';

  @override
  String get dashGreetingEvening => 'مساء الخير';

  @override
  String dashGreetingLine(Object greeting, Object name) {
    return '$greeting، $name';
  }

  @override
  String get dashNewMeeting => 'اجتماع جديد';

  @override
  String get dashNewMeetingHint => 'ابدأ اجتماعًا فوريًا وادعُ الآخرين';

  @override
  String get dashStarting => 'جارٍ البدء…';

  @override
  String get dashRecent => 'الاجتماعات الأخيرة';

  @override
  String get dashRecentEmpty => 'الاجتماعات التي تبدأها أو تنضم إليها ستظهر هنا.';

  @override
  String get dashRefresh => 'اسحب للتحديث';

  @override
  String get dashOpenProfile => 'الملف الشخصي';

  @override
  String get dashSignOut => 'تسجيل الخروج';

  @override
  String get dashErrorLoad => 'تعذّر تحميل اجتماعاتك.';

  @override
  String get dashNewMeetingTitle => 'اجتماع جديد';

  @override
  String get joinTitle => 'الانضمام لاجتماع';

  @override
  String get joinPlaceholder => 'أدخل كودًا أو رابطًا';

  @override
  String get joinCta => 'انضمام';

  @override
  String get joinInvalidCode => 'هذا لا يبدو كود اجتماع.';

  @override
  String get joinNotFound => 'لا يوجد اجتماع بهذا الكود.';

  @override
  String get meetingStatusActive => 'مباشر الآن';

  @override
  String get meetingStatusScheduled => 'لم يبدأ';

  @override
  String get meetingStatusEnded => 'انتهى';

  @override
  String meetingPeople(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count شخص',
      many: '$count شخصًا',
      few: '$count أشخاص',
      two: 'شخصان',
      one: 'شخص واحد',
      zero: 'لا أحد بعد',
    );
    return '$_temp0';
  }

  @override
  String meetingHostedBy(Object name) {
    return 'المضيف $name';
  }

  @override
  String get lobbyGettingReady => 'جارٍ تجهيز كل شيء…';

  @override
  String get lobbyReadyToJoin => 'جاهز للانضمام؟';

  @override
  String get lobbyFirstHere => 'أنت أول من هنا';

  @override
  String get lobbyOnePersonIn => 'شخص واحد في الاجتماع';

  @override
  String lobbyPeopleIn(int count) {
    return '$count أشخاص في الاجتماع';
  }

  @override
  String get lobbyCameraOn => 'الكاميرا مفعّلة';

  @override
  String get lobbyCameraOff => 'الكاميرا مغلقة';

  @override
  String get lobbyMicOn => 'المايك مفعّل';

  @override
  String get lobbyMicOff => 'المايك مغلق';

  @override
  String get lobbyJoinNow => 'انضم الآن';

  @override
  String get lobbyJoining => 'جارٍ الانضمام…';

  @override
  String get lobbyLeave => 'خروج';

  @override
  String get lobbyEnded => 'انتهى هذا الاجتماع.';

  @override
  String get lobbyNotFoundTitle => 'الاجتماع غير موجود';

  @override
  String get lobbyNotFoundText => 'تأكّد من الكود أو اطلب من المضيف رابطًا جديدًا.';

  @override
  String get lobbyCameraNote => 'معاينة الكاميرا والصوت يبدآن داخل الاجتماع.';

  @override
  String get roomShareCode => 'مشاركة الكود';

  @override
  String get roomCopied => 'تم نسخ الكود';

  @override
  String get roomLeave => 'مغادرة الاجتماع';

  @override
  String get roomConnecting => 'جارٍ الاتصال…';

  @override
  String get roomReconnecting => 'إعادة الاتصال…';

  @override
  String get roomDisconnected => 'انقطع الاتصال';

  @override
  String get roomLive => 'مباشر';

  @override
  String get roomYouParen => ' (أنت)';

  @override
  String get roomMicTitle => 'المايكروفون';

  @override
  String get roomCamTitle => 'الكاميرا';

  @override
  String get roomFlipTitle => 'قلب الكاميرا';

  @override
  String get roomLeaveTitle => 'مغادرة';

  @override
  String get roomPeopleTitle => 'الأشخاص';

  @override
  String get roomLeaveConfirmTitle => 'مغادرة الاجتماع؟';

  @override
  String get roomLeaveConfirmBody => 'يمكنك العودة في أي وقت بنفس الكود.';

  @override
  String get roomStay => 'البقاء';

  @override
  String get roomCantJoinTitle => 'تعذّر الانضمام لهذا الاجتماع';

  @override
  String get roomCantJoinText => 'قد يكون الاجتماع انتهى أو الرابط غير صحيح.';

  @override
  String get roomMediaBlocked => 'الكاميرا والمايك محظوران. لا يزال بإمكانك رؤية وسماع الآخرين.';

  @override
  String roomAlone(Object code) {
    return 'في انتظار انضمام الآخرين. شارِك الكود $code.';
  }

  @override
  String get roomParticipants => 'في هذا الاجتماع';

  @override
  String get roomChatTitle => 'المحادثة';

  @override
  String get roomHost => 'المضيف';

  @override
  String get roomOffline => 'غير متصل';

  @override
  String get roomYou => 'أنت';

  @override
  String get roomEndForAll => 'إنهاء للجميع';

  @override
  String get roomEndConfirmTitle => 'إنهاء الاجتماع؟';

  @override
  String get roomEndConfirmBody => 'هذا ينهي الاجتماع لجميع المشاركين.';

  @override
  String get roomEnd => 'إنهاء الاجتماع';

  @override
  String get roomPresenting => 'يعرض الشاشة';

  @override
  String get chatTitle => 'المحادثة';

  @override
  String get chatEmpty => 'لا رسائل بعد. ابدأ بالتحية 👋';

  @override
  String get chatPlaceholder => 'رسالة للجميع';

  @override
  String get ctlRequest => 'طلب التحكّم';

  @override
  String get ctlRequesting => 'في انتظار الموافقة…';

  @override
  String get ctlRequestTitle => 'طلب تحكّم';

  @override
  String ctlRequestBody(Object name) {
    return 'يريد $name التحكّم في شاشتك المشاركة.';
  }

  @override
  String get ctlAllow => 'السماح';

  @override
  String get ctlDeny => 'رفض';

  @override
  String get ctlStop => 'إيقاف';

  @override
  String ctlControlledBy(Object name) {
    return 'يتحكّم $name في شاشتك الآن';
  }

  @override
  String ctlControllingHint(Object name) {
    return 'تتحكّم في $name — اضغط زر الإيقاف للتحرير';
  }

  @override
  String get ctlKeyboard => 'لوحة المفاتيح';

  @override
  String get ctlDeniedBusy => 'هناك شخص آخر يتحكّم بالفعل';

  @override
  String get ctlDeniedNotSharing => 'توقّف عن مشاركة شاشته';

  @override
  String get ctlDeniedDenied => 'تم رفض الطلب';

  @override
  String get ctlAndroidTargetNote => 'التحكّم في جهازك من جهاز آخر يحتاج خدمة إتاحة كلاود ميت (أندرويد). iOS لا يمكن التحكّم فيه.';
}
