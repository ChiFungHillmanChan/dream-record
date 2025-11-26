import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api;
  
  User? _user;
  bool _isLoading = false;
  bool _isAuthenticated = false;
  String? _error;

  AuthProvider(this._api) {
    _checkAuth();
  }

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String? get error => _error;

  Future<void> _checkAuth() async {
    final token = await _api.getToken();
    if (token != null) {
      try {
        _user = await _api.getCurrentUser();
        _isAuthenticated = _user != null;
      } catch (e) {
        _isAuthenticated = false;
        await _api.clearToken();
      }
    }
    notifyListeners();
  }

  Future<bool> login(String identifier, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.login(identifier, password);
      
      if (response['success'] == true && response['user'] != null) {
        _user = User.fromJson(response['user']);
        _isAuthenticated = true;
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = response['error'] ?? '登入失敗';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = _parseError(e);
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
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
      
      if (response['success'] == true && response['user'] != null) {
        _user = User.fromJson(response['user']);
        _isAuthenticated = true;
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = response['error'] ?? '註冊失敗';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = _parseError(e);
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _api.logout();
    _user = null;
    _isAuthenticated = false;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  String _parseError(dynamic error) {
    if (error is Exception) {
      final errorStr = error.toString();
      // Try to extract error message from DioException
      if (errorStr.contains('error')) {
        final match = RegExp(r'"error":"([^"]+)"').firstMatch(errorStr);
        if (match != null) {
          return match.group(1) ?? '發生錯誤，請稍後再試';
        }
      }
    }
    return '發生錯誤，請稍後再試';
  }
}
