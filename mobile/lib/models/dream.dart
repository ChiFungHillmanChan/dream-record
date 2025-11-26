import 'package:json_annotation/json_annotation.dart';

part 'dream.g.dart';

@JsonSerializable()
class Dream {
  final String id;
  final String content;
  final String type; // 'dream' or 'no_dream'
  final String date;
  final List<String> tags;
  final DreamAnalysis? analysis;
  final DateTime createdAt;
  final DateTime updatedAt;

  Dream({
    required this.id,
    required this.content,
    required this.type,
    required this.date,
    required this.tags,
    this.analysis,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Dream.fromJson(Map<String, dynamic> json) {
    // Parse tags from JSON string if necessary
    List<String> parsedTags = [];
    if (json['tags'] is String) {
      try {
        final tagsList = (json['tags'] as String);
        // Remove brackets and quotes, split by comma
        parsedTags = tagsList
            .replaceAll('[', '')
            .replaceAll(']', '')
            .replaceAll('"', '')
            .split(',')
            .map((t) => t.trim())
            .where((t) => t.isNotEmpty)
            .toList();
      } catch (_) {
        parsedTags = [];
      }
    } else if (json['tags'] is List) {
      parsedTags = List<String>.from(json['tags']);
    }

    // Parse analysis from JSON string if necessary
    DreamAnalysis? parsedAnalysis;
    if (json['analysis'] != null) {
      if (json['analysis'] is String) {
        try {
          final analysisMap = Map<String, dynamic>.from(
            json['analysis'] is String 
              ? {} // Will be parsed in DreamAnalysis.fromJson
              : json['analysis']
          );
          parsedAnalysis = DreamAnalysis.fromJson(analysisMap);
        } catch (_) {
          parsedAnalysis = null;
        }
      } else if (json['analysis'] is Map) {
        parsedAnalysis = DreamAnalysis.fromJson(json['analysis']);
      }
    }

    return Dream(
      id: json['id'] as String,
      content: json['content'] as String,
      type: json['type'] as String,
      date: json['date'] as String,
      tags: parsedTags,
      analysis: parsedAnalysis,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => _$DreamToJson(this);

  bool get isDream => type == 'dream';
  bool get isNoDream => type == 'no_dream';
  bool get hasAnalysis => analysis != null;
}

@JsonSerializable()
class DreamAnalysis {
  final String summary;
  final List<AnalysisSection>? analysis;
  final String vibe;
  final String? reflection;

  DreamAnalysis({
    required this.summary,
    this.analysis,
    required this.vibe,
    this.reflection,
  });

  factory DreamAnalysis.fromJson(Map<String, dynamic> json) => 
      _$DreamAnalysisFromJson(json);
  Map<String, dynamic> toJson() => _$DreamAnalysisToJson(this);
}

@JsonSerializable()
class AnalysisSection {
  final String title;
  final String content;

  AnalysisSection({
    required this.title,
    required this.content,
  });

  factory AnalysisSection.fromJson(Map<String, dynamic> json) =>
      _$AnalysisSectionFromJson(json);
  Map<String, dynamic> toJson() => _$AnalysisSectionToJson(this);
}

