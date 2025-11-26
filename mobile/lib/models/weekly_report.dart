class WeeklyReport {
  final String id;
  final String content;
  final DateTime createdAt;

  WeeklyReport({
    required this.id,
    required this.content,
    required this.createdAt,
  });

  factory WeeklyReport.fromJson(Map<String, dynamic> json) {
    return WeeklyReport(
      id: json['id'] as String,
      content: json['content'] as String? ?? '',
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
