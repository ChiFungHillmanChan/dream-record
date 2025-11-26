import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'services/api_service.dart';
import 'providers/auth_provider.dart';
import 'providers/dream_provider.dart';
import 'utils/router.dart';
import 'utils/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize date formatting for Chinese locale
  await initializeDateFormatting('zh_TW', null);
  
  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: AppTheme.bg1,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  
  runApp(const DreamRecordApp());
}

class DreamRecordApp extends StatelessWidget {
  const DreamRecordApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Create ApiService instance
    final apiService = ApiService();
    
    return MultiProvider(
      providers: [
        // Provide ApiService
        Provider<ApiService>.value(value: apiService),
        
        // AuthProvider depends on ApiService
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => AuthProvider(apiService),
        ),
        
        // DreamProvider depends on ApiService
        ChangeNotifierProvider<DreamProvider>(
          create: (_) => DreamProvider(apiService),
        ),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return MaterialApp.router(
            title: '夢境紀錄器',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.darkTheme,
            routerConfig: createRouter(auth),
          );
        },
      ),
    );
  }
}
