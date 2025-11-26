import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/dream/dream_detail_screen.dart';
import '../screens/weekly_reports/weekly_reports_screen.dart';
import '../screens/settings/settings_screen.dart';

class AppRouter {
  static GoRouter router(AuthProvider auth) {
    return GoRouter(
      initialLocation: '/',
      refreshListenable: auth,
      redirect: (context, state) {
        final isLoggedIn = auth.isLoggedIn;
        final isAuthRoute = state.matchedLocation == '/login' ||
            state.matchedLocation == '/register';

        // If not logged in and not on auth route, redirect to login
        if (!isLoggedIn && !isAuthRoute) {
          return '/login';
        }

        // If logged in and on auth route, redirect to home
        if (isLoggedIn && isAuthRoute) {
          return '/';
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          builder: (context, state) => const RegisterScreen(),
        ),
        GoRoute(
          path: '/',
          builder: (context, state) => const HomeScreen(),
        ),
        GoRoute(
          path: '/dream/:id',
          builder: (context, state) {
            final dreamId = state.pathParameters['id']!;
            return DreamDetailScreen(dreamId: dreamId);
          },
        ),
        GoRoute(
          path: '/weekly-reports',
          builder: (context, state) => const WeeklyReportsScreen(),
        ),
        GoRoute(
          path: '/settings',
          builder: (context, state) => const SettingsScreen(),
        ),
      ],
      errorBuilder: (context, state) => Scaffold(
        body: Center(
          child: Text('Page not found: ${state.matchedLocation}'),
        ),
      ),
    );
  }
}


