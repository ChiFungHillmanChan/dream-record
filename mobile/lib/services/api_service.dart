import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../utils/constants.dart';
import '../models/user.dart';
import '../models/dream.dart';
import '../models/weekly_report.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  ApiService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
      },
    ));
    
    // Add auth interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: StorageKeys.authToken);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        // Handle 401 errors (token expired)
        if (error.response?.statusCode == 401) {
          // Token expired - clear storage
          _storage.delete(key: StorageKeys.authToken);
        }
        return handler.next(error);
      },
    ));
  }

  // ==================== Auth ====================

  Future<Map<String, dynamic>> login(String identifier, String password) async {
    final response = await _dio.post(
      ApiConstants.login,
      data: {
        'identifier': identifier,
        'password': password,
      },
    );
    
    if (response.data['success'] == true) {
      await _storage.write(
        key: StorageKeys.authToken,
        value: response.data['token'],
      );
    }
    
    return response.data;
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String confirmPassword,
    required String name,
    String? username,
  }) async {
    final response = await _dio.post(
      ApiConstants.register,
      data: {
        'email': email,
        'password': password,
        'confirmPassword': confirmPassword,
        'name': name,
        'username': username,
      },
    );
    
    if (response.data['success'] == true) {
      await _storage.write(
        key: StorageKeys.authToken,
        value: response.data['token'],
      );
    }
    
    return response.data;
  }

  Future<User?> getCurrentUser() async {
    try {
      final response = await _dio.get(ApiConstants.me);
      if (response.data['success'] == true) {
        return User.fromJson(response.data['user']);
      }
    } catch (e) {
      // Token might be invalid
    }
    return null;
  }

  Future<void> logout() async {
    await _storage.delete(key: StorageKeys.authToken);
  }

  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: StorageKeys.authToken);
    return token != null;
  }

  // ==================== Dreams ====================

  Future<List<Dream>> getDreams() async {
    final response = await _dio.get(ApiConstants.dreams);
    if (response.data['success'] == true) {
      final dreamsJson = response.data['dreams'] as List;
      return dreamsJson.map((json) => Dream.fromJson(json)).toList();
    }
    return [];
  }

  Future<Dream?> getDream(String id) async {
    final response = await _dio.get('${ApiConstants.dreams}/$id');
    if (response.data['success'] == true) {
      return Dream.fromJson(response.data['dream']);
    }
    return null;
  }

  Future<Map<String, dynamic>> createDream({
    required String content,
    required String type,
    required String date,
    required List<String> tags,
    String? analysis,
  }) async {
    final response = await _dio.post(
      ApiConstants.dreams,
      data: {
        'content': content,
        'type': type,
        'date': date,
        'tags': tags,
        'analysis': analysis,
      },
    );
    return response.data;
  }

  Future<Map<String, dynamic>> updateDream({
    required String id,
    String? content,
    String? type,
    String? date,
    List<String>? tags,
    String? analysis,
  }) async {
    final response = await _dio.put(
      '${ApiConstants.dreams}/$id',
      data: {
        if (content != null) 'content': content,
        if (type != null) 'type': type,
        if (date != null) 'date': date,
        if (tags != null) 'tags': tags,
        if (analysis != null) 'analysis': analysis,
      },
    );
    return response.data;
  }

  Future<Map<String, dynamic>> deleteDream(String id) async {
    final response = await _dio.delete('${ApiConstants.dreams}/$id');
    return response.data;
  }

  // ==================== Analysis ====================

  Future<Map<String, dynamic>> analyzeDream(String content) async {
    final response = await _dio.post(
      ApiConstants.analysis,
      data: {'content': content},
    );
    return response.data;
  }

  // ==================== Weekly Reports ====================

  Future<List<WeeklyReport>> getWeeklyReports() async {
    final response = await _dio.get(ApiConstants.weeklyReports);
    if (response.data['success'] == true) {
      final reportsJson = response.data['reports'] as List;
      return reportsJson.map((json) => WeeklyReport.fromJson(json)).toList();
    }
    return [];
  }

  Future<Map<String, dynamic>> generateWeeklyReport() async {
    final response = await _dio.post(ApiConstants.weeklyReports);
    return response.data;
  }

  // ==================== Transcription ====================

  Future<Map<String, dynamic>> transcribeAudio(File audioFile) async {
    final formData = FormData.fromMap({
      'audio': await MultipartFile.fromFile(
        audioFile.path,
        filename: 'recording.webm',
      ),
    });
    
    final response = await _dio.post(
      ApiConstants.transcribe,
      data: formData,
    );
    return response.data;
  }
}


