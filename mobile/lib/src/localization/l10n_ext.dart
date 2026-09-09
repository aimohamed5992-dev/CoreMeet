import 'package:flutter/widgets.dart';

import '../../l10n/app_localizations.dart';

extension L10nX on BuildContext {
  /// Shorthand for `L.of(context)`.
  L get l10n => L.of(this);

  bool get isRtl => Directionality.of(this) == TextDirection.rtl;
}
