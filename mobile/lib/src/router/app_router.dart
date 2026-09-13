import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_controller.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/lobby/lobby_screen.dart';
import '../features/room/room_screen.dart';
import '../features/splash/splash_screen.dart';

class Routes {
  static const splash = '/';
  static const login = '/login';
  static const register = '/register';
  static const dashboard = '/dashboard';

  static String lobby(String code) => '/meeting/$code';
  static String room(String code) => '/room/$code';
}

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = _AuthRefreshNotifier(ref);

  return GoRouter(
    // No initialLocation: honour the platform's initial route so `flutter run
    // --route=/room/<code>` works for testing. Normal launch is still "/".
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final loc = state.matchedLocation;
      final isAuthScreen =
          loc == Routes.login || loc == Routes.register || loc == Routes.splash;

      if (!auth.isResolved) {
        return loc == Routes.splash ? null : Routes.splash;
      }
      if (auth.isAuthenticated) {
        return isAuthScreen ? Routes.dashboard : null;
      }
      // Signed out: only the auth screens are reachable.
      return (loc == Routes.login || loc == Routes.register)
          ? null
          : Routes.login;
    },
    routes: [
      GoRoute(path: Routes.splash, builder: (_, __) => const SplashScreen()),
      GoRoute(path: Routes.login, builder: (_, __) => const LoginScreen()),
      GoRoute(path: Routes.register, builder: (_, __) => const RegisterScreen()),
      GoRoute(path: Routes.dashboard, builder: (_, __) => const DashboardScreen()),
      GoRoute(
        path: '/meeting/:code',
        builder: (_, state) => LobbyScreen(code: state.pathParameters['code']!),
      ),
      GoRoute(
        path: '/room/:code',
        builder: (_, state) => RoomScreen(code: state.pathParameters['code']!),
      ),
    ],
  );
});

/// Bridges Riverpod auth-state changes to go_router's [Listenable] API.
class _AuthRefreshNotifier extends ChangeNotifier {
  _AuthRefreshNotifier(Ref ref) {
    ref.listen(authControllerProvider, (_, __) => notifyListeners());
  }
}
