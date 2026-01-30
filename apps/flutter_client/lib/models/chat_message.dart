class ChatMessage {
  final String id;
  final String text;
  final DateTime createdAt;
  final bool isUser;

  ChatMessage({
    required this.id,
    required this.text,
    required this.createdAt,
    required this.isUser,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String,
      text: json['text'] as String,
      createdAt: DateTime.fromMillisecondsSinceEpoch(json['createdAt'] as int),
      isUser: json['isUser'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'createdAt': createdAt.millisecondsSinceEpoch,
      'isUser': isUser,
    };
  }
}
