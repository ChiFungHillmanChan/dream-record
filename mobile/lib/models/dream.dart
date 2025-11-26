class Dream {
  final String id;
  final String content;
  final String type;
  final String date;
  final List<String>? tags;
  final String? analysis;
  final DateTime createdAt;
  final DateTime updatedAt;

  Dream({
    required this.id,
    required this.content,
    required this.type,
    required this.date,
    this.tags,
    this.analysis,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Dream.fromJson(Map<String, dynamic> json) {
    return Dream(
      id: json['id'] as String,
      content: json['content'] as String? ?? '',
      type: json['type'] as String? ?? 'dream',
      date: json['date'] as String? ?? '',
      tags: json['tags'] != null 
          ? List<String>.from(json['tags'] as List) 
          : null,
      analysis: json['analysis'] as String?,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'type': type,
      'date': date,
      'tags': tags,
      'analysis': analysis,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
