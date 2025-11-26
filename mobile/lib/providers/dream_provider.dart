import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import '../models/dream.dart';
import '../services/api_service.dart';

class DreamProvider extends ChangeNotifier {
  final ApiService _api;
  
  List<Dream> _dreams = [];
  bool _isLoading = false;
  bool _isAnalyzing = false;
  bool _isRecording = false;
  bool _isTranscribing = false;
  String? _error;
  Map<String, dynamic>? _analysisResult;

  DreamProvider(this._api);

  List<Dream> get dreams => _dreams;
  bool get isLoading => _isLoading;
  bool get isAnalyzing => _isAnalyzing;
  bool get isRecording => _isRecording;
  bool get isTranscribing => _isTranscribing;
  String? get error => _error;
  Map<String, dynamic>? get analysisResult => _analysisResult;

  // Calculate streak
  int getStreak() {
    if (_dreams.isEmpty) return 0;
    
    final today = DateTime.now();
    final todayStr = DateFormat('yyyy-MM-dd').format(today);
    
    // Sort dreams by date descending
    final sortedDreams = List<Dream>.from(_dreams)
      ..sort((a, b) => b.date.compareTo(a.date));
    
    // Get unique dates
    final uniqueDates = sortedDreams.map((d) => d.date).toSet().toList()
      ..sort((a, b) => b.compareTo(a));
    
    if (uniqueDates.isEmpty) return 0;
    
    int streak = 0;
    DateTime checkDate = today;
    
    // Check if today has a dream
    if (!uniqueDates.contains(todayStr)) {
      // Check yesterday
      checkDate = today.subtract(const Duration(days: 1));
    }
    
    for (int i = 0; i < 365; i++) {
      final dateStr = DateFormat('yyyy-MM-dd').format(checkDate);
      if (uniqueDates.contains(dateStr)) {
        streak++;
        checkDate = checkDate.subtract(const Duration(days: 1));
      } else {
        break;
      }
    }
    
    return streak;
  }

  Future<void> loadDreams() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _dreams = await _api.getDreams();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> saveDream({
    String? id,
    required String content,
    required List<String> tags,
    required String type,
    String? analysis,
  }) async {
    _error = null;
    
    try {
      final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
      
      await _api.saveDream(
        id: id,
        content: content,
        tags: tags,
        type: type,
        date: today,
        analysis: analysis ?? (_analysisResult != null ? _analysisResult.toString() : null),
      );
      
      await loadDreams();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteDream(String id) async {
    _error = null;
    
    try {
      await _api.deleteDream(id);
      _dreams.removeWhere((d) => d.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> analyzeDream(String content) async {
    _isAnalyzing = true;
    _error = null;
    notifyListeners();

    try {
      _analysisResult = await _api.analyzeDream(content);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isAnalyzing = false;
      notifyListeners();
    }
  }

  void clearAnalysis() {
    _analysisResult = null;
    notifyListeners();
  }

  // Voice recording methods (placeholder - actual implementation would use record package)
  Future<void> startRecording() async {
    _isRecording = true;
    notifyListeners();
    // TODO: Implement actual recording using record package
  }

  Future<String?> stopRecording() async {
    _isRecording = false;
    _isTranscribing = true;
    notifyListeners();
    
    try {
      // TODO: Implement actual transcription
      // For now, return empty string
      await Future.delayed(const Duration(seconds: 1));
      return '';
    } finally {
      _isTranscribing = false;
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
