import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/dream/dream_detail_screen.dart';
import '../screens/weekly_reports/weekly_reports_screen.dart';
import '../screens/settings/settings_screen.dart';

GoRouter createRouter(AuthProvider auth) {
  return GoRouter(
    initialLocation: '/',
    refreshListenable: auth,
    redirect: (context, state) {
      final isLoggedIn = auth.isAuthenticated;
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
        path: '/',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
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
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              '🌙',
              style: TextStyle(fontSize: 48),
            ),
            const SizedBox(height: 16),
            const Text(
              '頁面不存在',
              style: TextStyle(fontSize: 18, color: Colors.white),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => context.go('/'),
              child: const Text('返回首頁'),
            ),
          ],
        ),
      ),
    ),
  );
}
