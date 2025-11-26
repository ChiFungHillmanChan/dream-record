import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/dream_provider.dart';
import 'utils/router.dart';
import 'utils/theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const DreamRecordApp());
}

class DreamRecordApp extends StatelessWidget {
  const DreamRecordApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProxyProvider<AuthProvider, DreamProvider>(
          create: (_) => DreamProvider(),
          update: (_, auth, dreams) => dreams!..updateAuth(auth),
        ),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return MaterialApp.router(
            title: '夢境紀錄',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.darkTheme,
            routerConfig: AppRouter.router(auth),
          );
        },
      ),
    );
  }
}


