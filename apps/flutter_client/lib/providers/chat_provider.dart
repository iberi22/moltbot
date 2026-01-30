import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_client/models/chat_message.dart';
import 'package:flutter_client/services/websocket_service.dart';
import 'dart:convert';

enum ConnectionStatus { disconnected, connecting, connected, error }

class ChatState {
  final List<ChatMessage> messages;
  final ConnectionStatus status;
  final String? error;

  ChatState({
    this.messages = const [],
    this.status = ConnectionStatus.disconnected,
    this.error,
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    ConnectionStatus? status,
    String? error,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      status: status ?? this.status,
      error: error ?? this.error,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  WebSocketService? _service;

  ChatNotifier() : super(ChatState());

  void connect(String url) {
    if (state.status == ConnectionStatus.connected) return;

    state = state.copyWith(status: ConnectionStatus.connecting, error: null);

    _service = WebSocketService(
      onConnected: () {
        state = state.copyWith(status: ConnectionStatus.connected);
      },
      onDisconnected: () {
        state = state.copyWith(status: ConnectionStatus.disconnected);
      },
      onError: (err) {
        state = state.copyWith(
          status: ConnectionStatus.error,
          error: err.toString(),
        );
      },
      onMessageReceived: (data) {
        _handleIncomingMessage(data);
      },
    );

    _service!.connect(url);
  }

  void disconnect() {
    _service?.disconnect();
    state = state.copyWith(status: ConnectionStatus.disconnected);
  }

  void sendMessage(String text) {
    if (state.status != ConnectionStatus.connected) return;

    final tempId = DateTime.now().millisecondsSinceEpoch.toString();
    final message = ChatMessage(
      id: tempId,
      text: text,
      createdAt: DateTime.now(),
      isUser: true,
    );

    // Optimistically add message
    state = state.copyWith(messages: [...state.messages, message]);

    // Construct payload - mimicking standard JSON RPC or event format
    // This might need adjustment based on actual server protocol
    final payload = {
      "method": "chat.send",
      "params": {
        "text": text,
      },
      "jsonrpc": "2.0",
      "id": tempId
    };

    _service!.send(payload);
  }

  void _handleIncomingMessage(dynamic data) {
    try {
      // Decode if string
      final parsed = data is String ? jsonDecode(data) : data;

      // Attempt to extract text from common structures
      // Note: This is a simplification. Real implementation needs robust protocol parsing.
      String? text;
      String? id;
      bool isUser = false;

      if (parsed is Map) {
         if (parsed.containsKey('result')) {
             // Response to our message?
             return;
         }

         // Assuming event structure
         // e.g. { "method": "chat.message", "params": { "text": "..." } }
         if (parsed['method'] == 'chat.message') {
           text = parsed['params']?['text'];
           id = parsed['params']?['id'] ?? DateTime.now().millisecondsSinceEpoch.toString();
         }

         // Or direct message object
         if (parsed.containsKey('text')) {
           text = parsed['text'];
           id = parsed['id'] ?? DateTime.now().millisecondsSinceEpoch.toString();
         }
      }

      if (text != null) {
        final message = ChatMessage(
          id: id!,
          text: text,
          createdAt: DateTime.now(),
          isUser: isUser,
        );
        state = state.copyWith(messages: [...state.messages, message]);
      }

    } catch (e) {
      print("Error parsing message: $e");
    }
  }
}

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  return ChatNotifier();
});
