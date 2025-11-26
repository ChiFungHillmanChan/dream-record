import 'package:json_annotation/json_annotation.dart';

part 'weekly_report.g.dart';

@JsonSerializable()
class WeeklyReport {
  final String id;
  final DateTime startDate;
  final DateTime endDate;
  final WeeklyReportAnalysis analysis;
  final String? imageBase64;
  final DateTime createdAt;

  WeeklyReport({
    required this.id,
    required this.startDate,
    required this.endDate,
    required this.analysis,
    this.imageBase64,
    required this.createdAt,
  });

  factory WeeklyReport.fromJson(Map<String, dynamic> json) {
    // Parse analysis from JSON string if necessary
    WeeklyReportAnalysis parsedAnalysis;
    if (json['analysis'] is String) {
      try {
        final analysisMap = Map<String, dynamic>.from(
          json['analysis'] is String ? {} : json['analysis']
        );
        parsedAnalysis = WeeklyReportAnalysis.fromJson(analysisMap);
      } catch (_) {
        parsedAnalysis = WeeklyReportAnalysis.empty();
      }
    } else {
      parsedAnalysis = WeeklyReportAnalysis.fromJson(json['analysis']);
    }

    return WeeklyReport(
      id: json['id'] as String,
      startDate: DateTime.parse(json['startDate'] as String),
      endDate: DateTime.parse(json['endDate'] as String),
      analysis: parsedAnalysis,
      imageBase64: json['imageBase64'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => _$WeeklyReportToJson(this);
}

@JsonSerializable()
class WeeklyReportAnalysis {
  final String wordOfTheWeek;
  final String summary;
  final List<Theme> themes;
  final Metrics metrics;
  final String emotionalTrajectory;
  final String deepInsight;
  final String advice;
  final String reflectionQuestion;

  WeeklyReportAnalysis({
    required this.wordOfTheWeek,
    required this.summary,
    required this.themes,
    required this.metrics,
    required this.emotionalTrajectory,
    required this.deepInsight,
    required this.advice,
    required this.reflectionQuestion,
  });

  factory WeeklyReportAnalysis.empty() => WeeklyReportAnalysis(
    wordOfTheWeek: '',
    summary: '',
    themes: [],
    metrics: Metrics.empty(),
    emotionalTrajectory: '',
    deepInsight: '',
    advice: '',
    reflectionQuestion: '',
  );

  factory WeeklyReportAnalysis.fromJson(Map<String, dynamic> json) =>
      _$WeeklyReportAnalysisFromJson(json);
  Map<String, dynamic> toJson() => _$WeeklyReportAnalysisToJson(this);
}

@JsonSerializable()
class Theme {
  final String name;
  final String description;
  final double score;

  Theme({
    required this.name,
    required this.description,
    required this.score,
  });

  factory Theme.fromJson(Map<String, dynamic> json) => _$ThemeFromJson(json);
  Map<String, dynamic> toJson() => _$ThemeToJson(this);
}

@JsonSerializable()
class Metrics {
  final double sleepQualityIndex;
  final double nightmareRatio;
  final double recurringSymbolScore;
  final double awakeningArousalLevel;
  final int lucidDreamCount;
  final double emotionVolatility;

  Metrics({
    required this.sleepQualityIndex,
    required this.nightmareRatio,
    required this.recurringSymbolScore,
    required this.awakeningArousalLevel,
    required this.lucidDreamCount,
    required this.emotionVolatility,
  });

  factory Metrics.empty() => Metrics(
    sleepQualityIndex: 0,
    nightmareRatio: 0,
    recurringSymbolScore: 0,
    awakeningArousalLevel: 0,
    lucidDreamCount: 0,
    emotionVolatility: 0,
  );

  factory Metrics.fromJson(Map<String, dynamic> json) => _$MetricsFromJson(json);
  Map<String, dynamic> toJson() => _$MetricsToJson(this);
}


