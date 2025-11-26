// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'weekly_report.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

WeeklyReport _$WeeklyReportFromJson(Map<String, dynamic> json) => WeeklyReport(
      id: json['id'] as String,
      startDate: DateTime.parse(json['startDate'] as String),
      endDate: DateTime.parse(json['endDate'] as String),
      analysis:
          WeeklyReportAnalysis.fromJson(json['analysis'] as Map<String, dynamic>),
      imageBase64: json['imageBase64'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$WeeklyReportToJson(WeeklyReport instance) =>
    <String, dynamic>{
      'id': instance.id,
      'startDate': instance.startDate.toIso8601String(),
      'endDate': instance.endDate.toIso8601String(),
      'analysis': instance.analysis.toJson(),
      'imageBase64': instance.imageBase64,
      'createdAt': instance.createdAt.toIso8601String(),
    };

WeeklyReportAnalysis _$WeeklyReportAnalysisFromJson(Map<String, dynamic> json) =>
    WeeklyReportAnalysis(
      wordOfTheWeek: json['word_of_the_week'] as String? ?? '',
      summary: json['summary'] as String? ?? '',
      themes: (json['themes'] as List<dynamic>?)
              ?.map((e) => Theme.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      metrics: json['metrics'] == null
          ? Metrics.empty()
          : Metrics.fromJson(json['metrics'] as Map<String, dynamic>),
      emotionalTrajectory: json['emotional_trajectory'] as String? ?? '',
      deepInsight: json['deep_insight'] as String? ?? '',
      advice: json['advice'] as String? ?? '',
      reflectionQuestion: json['reflection_question'] as String? ?? '',
    );

Map<String, dynamic> _$WeeklyReportAnalysisToJson(
        WeeklyReportAnalysis instance) =>
    <String, dynamic>{
      'word_of_the_week': instance.wordOfTheWeek,
      'summary': instance.summary,
      'themes': instance.themes.map((e) => e.toJson()).toList(),
      'metrics': instance.metrics.toJson(),
      'emotional_trajectory': instance.emotionalTrajectory,
      'deep_insight': instance.deepInsight,
      'advice': instance.advice,
      'reflection_question': instance.reflectionQuestion,
    };

Theme _$ThemeFromJson(Map<String, dynamic> json) => Theme(
      name: json['name'] as String,
      description: json['description'] as String,
      score: (json['score'] as num).toDouble(),
    );

Map<String, dynamic> _$ThemeToJson(Theme instance) => <String, dynamic>{
      'name': instance.name,
      'description': instance.description,
      'score': instance.score,
    };

Metrics _$MetricsFromJson(Map<String, dynamic> json) => Metrics(
      sleepQualityIndex: (json['sleepQualityIndex'] as num?)?.toDouble() ?? 0,
      nightmareRatio: (json['nightmareRatio'] as num?)?.toDouble() ?? 0,
      recurringSymbolScore:
          (json['recurringSymbolScore'] as num?)?.toDouble() ?? 0,
      awakeningArousalLevel:
          (json['awakeningArousalLevel'] as num?)?.toDouble() ?? 0,
      lucidDreamCount: json['lucidDreamCount'] as int? ?? 0,
      emotionVolatility: (json['emotionVolatility'] as num?)?.toDouble() ?? 0,
    );

Map<String, dynamic> _$MetricsToJson(Metrics instance) => <String, dynamic>{
      'sleepQualityIndex': instance.sleepQualityIndex,
      'nightmareRatio': instance.nightmareRatio,
      'recurringSymbolScore': instance.recurringSymbolScore,
      'awakeningArousalLevel': instance.awakeningArousalLevel,
      'lucidDreamCount': instance.lucidDreamCount,
      'emotionVolatility': instance.emotionVolatility,
    };


