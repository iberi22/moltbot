import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_client/models/chat_message.dart';
import 'package:flutter_client/services/gateway_client.dart';
import 'package:flutter_client/providers/gateway_provider.dart';
import 'dart:developer';

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
  final GatewayClient _client;
  String _sessionKey = 'main';

  ChatNotifier(this._client) : super(ChatState()) {
    // Listen to connection state
    _client.onConnected = () {
      state = state.copyWith(status: ConnectionStatus.connected);
      _loadHistory();
    };
    _client.onDisconnected = () {
      state = state.copyWith(status: ConnectionStatus.disconnected);
    };
    _client.onError = (err) {
      state = state.copyWith(
        status: ConnectionStatus.error,
        error: err.toString(),
      );
    };

    // Listen to events
    _client.events.listen(_handleEvent);
  }

  void connect(String url) {
    if (state.status == ConnectionStatus.connected) return;
    state = state.copyWith(status: ConnectionStatus.connecting, error: null);
    _client.connect(url);
  }

  void _loadHistory() {
     _client.request('chat.history', {'key': _sessionKey}).then((history) {
       if (history is List) {
         final messages = history.map((msg) {
           return ChatMessage(
             id: msg['id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
             text: msg['text'] ?? '',
             createdAt: DateTime.now(),
             isUser: msg['role'] == 'user',
           );
         }).toList();
         state = state.copyWith(messages: messages);
       }
     }).catchError((e) {
       log('Error loading history: $e');
     });
  }

  void disconnect() {
    _client.disconnect();
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

    state = state.copyWith(messages: [...state.messages, message]);

    _client.request('chat.send', {
      'message': text,
      'sessionKey': _sessionKey,
    }).catchError((e) {
      log('Send failed: $e');
      state = state.copyWith(error: 'Failed to send message: $e');
    });
  }

  void _handleEvent(Map<String, dynamic> event) {
    final type = event['event'];
    final payload = event['payload'];

    if (type == 'chat.message') {
      final text = payload['text'];
      final role = payload['role'];
      final id = payload['id'];

      if (role == 'assistant') {
        final message = ChatMessage(
          id: id ?? DateTime.now().millisecondsSinceEpoch.toString(),
          text: text ?? '',
          createdAt: DateTime.now(),
          isUser: false,
        );
        state = state.copyWith(messages: [...state.messages, message]);
      }
    }
  }
}

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  final client = ref.watch(gatewayClientProvider);
  return ChatNotifier(client);
});
