import 'dart:convert';
import 'dart:developer';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;

class WebSocketService {
  WebSocketChannel? _channel;
  final Function(dynamic) onMessageReceived;
  final Function() onConnected;
  final Function() onDisconnected;
  final Function(dynamic) onError;

  WebSocketService({
    required this.onMessageReceived,
    required this.onConnected,
    required this.onDisconnected,
    required this.onError,
  });

  void connect(String url) {
    try {
      log('Connecting to $url');
      // Ensure we use wss if the url is https, or ws if http
      // But Cloudflare tunnels are usually https, so wss.
      // If the user inputs "https://...", convert to "wss://..."
      String wsUrl = url;
      if (url.startsWith('https://')) {
        wsUrl = url.replaceFirst('https://', 'wss://');
      } else if (url.startsWith('http://')) {
        wsUrl = url.replaceFirst('http://', 'ws://');
      }

      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      onConnected();

      _channel!.stream.listen(
        (message) {
          log('Received: $message');
          onMessageReceived(message);
        },
        onDone: () {
          log('WebSocket Closed');
          onDisconnected();
        },
        onError: (error) {
          log('WebSocket Error: $error');
          onError(error);
          onDisconnected();
        },
      );
    } catch (e) {
      log('Connection Exception: $e');
      onError(e);
      onDisconnected();
    }
  }

  void send(dynamic message) {
    if (_channel != null) {
      if (message is Map) {
        _channel!.sink.add(jsonEncode(message));
      } else {
        _channel!.sink.add(message);
      }
    } else {
      log('Cannot send: WebSocket is not connected');
    }
  }

  void disconnect() {
    if (_channel != null) {
      _channel!.sink.close(status.goingAway);
      _channel = null;
      onDisconnected();
    }
  }
}
