import 'dart:io';
import 'package:flutter/foundation.dart';
import '../models/dream.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';

class DreamProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  AuthProvider? _auth;
  
  List<Dream> _dreams = [];
  bool _isLoading = false;
  bool _isAnalyzing = false;
  bool _isTranscribing = false;
  String? _error;

  List<Dream> get dreams => _dreams;
  bool get isLoading => _isLoading;
  bool get isAnalyzing => _isAnalyzing;
  bool get isTranscribing => _isTranscribing;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    _auth = auth;
    if (auth.isLoggedIn) {
      loadDreams();
    } else {
      _dreams = [];
      notifyListeners();
    }
  }

  Future<void> loadDreams() async {
    if (_auth == null || !_auth!.isLoggedIn) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _dreams = await _api.getDreams();
    } catch (e) {
      _error = '載入夢境失敗';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Dream?> getDream(String id) async {
    try {
      return await _api.getDream(id);
    } catch (e) {
      return null;
    }
  }

  Future<bool> saveDream({
    required String content,
    required String type,
    required String date,
    required List<String> tags,
    String? analysis,
    String? id,
  }) async {
    _error = null;

    try {
      Map<String, dynamic> response;
      
      if (id != null) {
        response = await _api.updateDream(
          id: id,
          content: content,
          type: type,
          date: date,
          tags: tags,
          analysis: analysis,
        );
      } else {
        response = await _api.createDream(
          content: content,
          type: type,
          date: date,
          tags: tags,
          analysis: analysis,
        );
      }
      
      if (response['success'] == true) {
        await loadDreams();
        return true;
      } else {
        _error = response['error'] ?? '保存失敗';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = '網絡錯誤';
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteDream(String id) async {
    _error = null;

    try {
      final response = await _api.deleteDream(id);
      
      if (response['success'] == true) {
        _dreams.removeWhere((d) => d.id == id);
        notifyListeners();
        return true;
      } else {
        _error = response['error'] ?? '刪除失敗';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = '網絡錯誤';
      notifyListeners();
      return false;
    }
  }

  Future<DreamAnalysis?> analyzeDream(String content) async {
    _isAnalyzing = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.analyzeDream(content);
      
      if (response['success'] == true && response['result'] != null) {
        _isAnalyzing = false;
        notifyListeners();
        
        // Refresh user to update remaining analyses count
        _auth?.refreshUser();
        
        return DreamAnalysis.fromJson(response['result']);
      } else {
        _error = response['error'] ?? 'AI 分析失敗';
        _isAnalyzing = false;
        notifyListeners();
        return null;
      }
    } catch (e) {
      _error = '網絡錯誤';
      _isAnalyzing = false;
      notifyListeners();
      return null;
    }
  }

  Future<String?> transcribeAudio(File audioFile) async {
    _isTranscribing = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.transcribeAudio(audioFile);
      
      if (response['success'] == true && response['text'] != null) {
        _isTranscribing = false;
        notifyListeners();
        return response['text'];
      } else {
        _error = response['error'] ?? '語音轉文字失敗';
        _isTranscribing = false;
        notifyListeners();
        return null;
      }
    } catch (e) {
      _error = '網絡錯誤';
      _isTranscribing = false;
      notifyListeners();
      return null;
    }
  }

  // Helper methods
  List<Dream> getDreamsForDate(String date) {
    return _dreams.where((d) => d.date == date).toList();
  }

  bool hasNoDreamForDate(String date) {
    return _dreams.any((d) => d.date == date && d.type == 'no_dream');
  }

  int get totalDreams => _dreams.length;
  int get dreamCount => _dreams.where((d) => d.type == 'dream').length;
  int get noDreamCount => _dreams.where((d) => d.type == 'no_dream').length;

  int getStreak() {
    final uniqueDates = _dreams.map((d) => d.date).toSet();
    final today = DateTime.now();
    int streak = 0;
    
    for (int i = 0; i < 365; i++) {
      final date = today.subtract(Duration(days: i));
      final dateStr = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
      
      if (uniqueDates.contains(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}


