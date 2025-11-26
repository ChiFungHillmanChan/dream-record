import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  final String id;
  final String email;
  final String? name;
  final String? username;
  final String role;
  final String plan;
  final DateTime? planExpiresAt;
  final int lifetimeAnalysisCount;
  final int lifetimeWeeklyReportCount;
  final int remainingAnalyses;

  User({
    required this.id,
    required this.email,
    this.name,
    this.username,
    required this.role,
    required this.plan,
    this.planExpiresAt,
    this.lifetimeAnalysisCount = 0,
    this.lifetimeWeeklyReportCount = 0,
    this.remainingAnalyses = 20,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);

  bool get isPremium => plan == 'DEEP' || role == 'SUPERADMIN';
  bool get isSuperAdmin => role == 'SUPERADMIN';
}


