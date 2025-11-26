// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

User _$UserFromJson(Map<String, dynamic> json) => User(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
      username: json['username'] as String?,
      role: json['role'] as String? ?? 'USER',
      plan: json['plan'] as String? ?? 'FREE',
      planExpiresAt: json['planExpiresAt'] == null
          ? null
          : DateTime.parse(json['planExpiresAt'] as String),
      lifetimeAnalysisCount: json['lifetimeAnalysisCount'] as int? ?? 0,
      lifetimeWeeklyReportCount: json['lifetimeWeeklyReportCount'] as int? ?? 0,
      remainingAnalyses: json['remainingAnalyses'] as int? ?? 20,
    );

Map<String, dynamic> _$UserToJson(User instance) => <String, dynamic>{
      'id': instance.id,
      'email': instance.email,
      'name': instance.name,
      'username': instance.username,
      'role': instance.role,
      'plan': instance.plan,
      'planExpiresAt': instance.planExpiresAt?.toIso8601String(),
      'lifetimeAnalysisCount': instance.lifetimeAnalysisCount,
      'lifetimeWeeklyReportCount': instance.lifetimeWeeklyReportCount,
      'remainingAnalyses': instance.remainingAnalyses,
    };


