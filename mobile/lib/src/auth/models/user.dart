import 'package:flutter/foundation.dart';

@immutable
class User {
  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.avatarColor,
    this.avatarUrl,
  });

  final String id;
  final String name;
  final String email;
  final String avatarColor;
  final String? avatarUrl;

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        email: json['email'] as String? ?? '',
        avatarColor: json['avatarColor'] as String? ?? '#1FA84C',
        avatarUrl: (json['avatarUrl'] as String?)?.isEmpty ?? true
            ? null
            : json['avatarUrl'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'avatarColor': avatarColor,
        'avatarUrl': avatarUrl,
      };

  User copyWith({String? name, String? avatarUrl}) => User(
        id: id,
        name: name ?? this.name,
        email: email,
        avatarColor: avatarColor,
        avatarUrl: avatarUrl ?? this.avatarUrl,
      );
}
