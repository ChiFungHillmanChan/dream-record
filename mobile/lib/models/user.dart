class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String plan;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.plan,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      role: json['role'] as String? ?? 'USER',
      plan: json['plan'] as String? ?? 'FREE',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'plan': plan,
    };
  }
}
