import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user.dart';
import '../models/dream.dart';

class ApiService {
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  // TODO: Update this to your actual API URL
  // For local development, use your machine's IP address instead of localhost
  // e.g., 'http://192.168.1.100:3000/api'
  static const String baseUrl = 'http://localhost:3000/api';
  
  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
      },
    ));
    
    // Add interceptor for authentication
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Token expired or invalid, clear storage
          await _storage.delete(key: 'auth_token');
        }
        return handler.next(error);
      },
    ));
  }
  
  // Token management
  Future<void> setToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
  }
  
  Future<String?> getToken() async {
    return await _storage.read(key: 'auth_token');
  }
  
  Future<void> clearToken() async {
    await _storage.delete(key: 'auth_token');
  }
  
  // Auth endpoints
  Future<Map<String, dynamic>> login(String identifier, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'identifier': identifier,
      'password': password,
    });
    
    if (response.data['token'] != null) {
      await setToken(response.data['token']);
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
    final response = await _dio.post('/auth/register', data: {
      'email': email,
      'password': password,
      'confirmPassword': confirmPassword,
      'name': name,
      if (username != null) 'username': username,
    });
    
    if (response.data['token'] != null) {
      await setToken(response.data['token']);
    }
    
    return response.data;
  }
  
  Future<User?> getCurrentUser() async {
    try {
      final response = await _dio.get('/auth/me');
      if (response.data['user'] != null) {
        return User.fromJson(response.data['user']);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
  
  Future<void> logout() async {
    await clearToken();
  }
  
  // Dream endpoints
  Future<List<Dream>> getDreams() async {
    final response = await _dio.get('/dreams');
    final List<dynamic> dreamsJson = response.data['dreams'] ?? [];
    return dreamsJson.map((json) => Dream.fromJson(json)).toList();
  }
  
  Future<Dream?> getDreamById(String id) async {
    final response = await _dio.get('/dreams/$id');
    if (response.data['dream'] != null) {
      return Dream.fromJson(response.data['dream']);
    }
    return null;
  }
  
  Future<void> saveDream({
    String? id,
    required String content,
    required List<String> tags,
    required String type,
    required String date,
    String? analysis,
  }) async {
    final data = {
      'content': content,
      'tags': tags,
      'type': type,
      'date': date,
      if (analysis != null) 'analysis': analysis,
    };
    
    if (id != null) {
      await _dio.put('/dreams/$id', data: data);
    } else {
      await _dio.post('/dreams', data: data);
    }
  }
  
  Future<void> deleteDream(String id) async {
    await _dio.delete('/dreams/$id');
  }
  
  // Analysis endpoint
  Future<Map<String, dynamic>> analyzeDream(String content) async {
    final response = await _dio.post('/analysis', data: {
      'content': content,
    });
    return response.data['result'] ?? {};
  }
  
  // Weekly reports endpoints
  Future<List<dynamic>> getWeeklyReports() async {
    final response = await _dio.get('/weekly-reports');
    return response.data['reports'] ?? [];
  }
  
  Future<void> generateWeeklyReport() async {
    await _dio.post('/weekly-reports');
  }
  
  // Transcription endpoint
  Future<String> transcribeAudio(List<int> audioData) async {
    final formData = FormData.fromMap({
      'audio': MultipartFile.fromBytes(audioData, filename: 'recording.webm'),
    });
    
    final response = await _dio.post('/transcribe', data: formData);
    return response.data['text'] ?? '';
  }
}
