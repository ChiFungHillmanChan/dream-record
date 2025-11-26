// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dream.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Dream _$DreamFromJson(Map<String, dynamic> json) => Dream(
      id: json['id'] as String,
      content: json['content'] as String,
      type: json['type'] as String,
      date: json['date'] as String,
      tags: (json['tags'] as List<dynamic>).map((e) => e as String).toList(),
      analysis: json['analysis'] == null
          ? null
          : DreamAnalysis.fromJson(json['analysis'] as Map<String, dynamic>),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$DreamToJson(Dream instance) => <String, dynamic>{
      'id': instance.id,
      'content': instance.content,
      'type': instance.type,
      'date': instance.date,
      'tags': instance.tags,
      'analysis': instance.analysis?.toJson(),
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

DreamAnalysis _$DreamAnalysisFromJson(Map<String, dynamic> json) =>
    DreamAnalysis(
      summary: json['summary'] as String? ?? '',
      analysis: (json['analysis'] as List<dynamic>?)
          ?.map((e) => AnalysisSection.fromJson(e as Map<String, dynamic>))
          .toList(),
      vibe: json['vibe'] as String? ?? '',
      reflection: json['reflection'] as String?,
    );

Map<String, dynamic> _$DreamAnalysisToJson(DreamAnalysis instance) =>
    <String, dynamic>{
      'summary': instance.summary,
      'analysis': instance.analysis?.map((e) => e.toJson()).toList(),
      'vibe': instance.vibe,
      'reflection': instance.reflection,
    };

AnalysisSection _$AnalysisSectionFromJson(Map<String, dynamic> json) =>
    AnalysisSection(
      title: json['title'] as String,
      content: json['content'] as String,
    );

Map<String, dynamic> _$AnalysisSectionToJson(AnalysisSection instance) =>
    <String, dynamic>{
      'title': instance.title,
      'content': instance.content,
    };


