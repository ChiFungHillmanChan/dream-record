import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  
  User? _user;
  bool _isLoading = false;
  String? _error;
  bool _isInitialized = false;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isLoggedIn => _user != null;
  bool get isInitialized => _isInitialized;

  AuthProvider() {
    _init();
  }

  Future<void> _init() async {
    _isLoading = true;
    notifyListeners();

    try {
      final isLoggedIn = await _api.isLoggedIn();
      if (isLoggedIn) {
        _user = await _api.getCurrentUser();
      }
    } catch (e) {
      // Token might be invalid, user will need to login again
      _user = null;
    } finally {
      _isLoading = false;
      _isInitialized = true;
      notifyListeners();
    }
  }

  Future<bool> login(String identifier, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.login(identifier, password);
      
      if (response['success'] == true) {
        _user = await _api.getCurrentUser();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['error'] ?? '登入失敗';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = '網絡錯誤，請稍後再試';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String confirmPassword,
    required String name,
    String? username,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.register(
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        name: name,
        username: username,
      );
      
      if (response['success'] == true) {
        _user = await _api.getCurrentUser();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['error'] ?? '註冊失敗';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = '網絡錯誤，請稍後再試';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _api.logout();
    _user = null;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    try {
      _user = await _api.getCurrentUser();
      notifyListeners();
    } catch (e) {
      // Ignore errors during refresh
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}


