class ApiConstants {
  // Change this to your actual API base URL
  // For local development on Android emulator: http://10.0.2.2:3000
  // For local development on iOS simulator: http://localhost:3000
  // For production: https://your-domain.com
  static const String baseUrl = 'http://localhost:3000';
  
  // API Endpoints
  static const String login = '/api/auth/login';
  static const String register = '/api/auth/register';
  static const String me = '/api/auth/me';
  static const String dreams = '/api/dreams';
  static const String analysis = '/api/analysis';
  static const String weeklyReports = '/api/weekly-reports';
  static const String transcribe = '/api/transcribe';
}

class StorageKeys {
  static const String authToken = 'auth_token';
  static const String userId = 'user_id';
  static const String customTags = 'user_custom_tags';
}

class AppConstants {
  static const List<String> defaultTags = [
    '開心', '可怕', '親情', '奇幻', '戀愛'
  ];
  
  static const List<String> allPresetTags = [
    '開心', '可怕', '感動', '親情', '離世', '奇幻', 
    '追逐', '飛翔', '戀愛', '工作', '考試', '清醒夢', '噩夢', '搞笑'
  ];
}

