import 'dart:async';
import 'dart:convert';
import 'dart:developer';
import 'dart:math' as math;
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;

class GatewayClient {
  WebSocketChannel? _channel;
  final StreamController<Map<String, dynamic>> _eventController = StreamController.broadcast();
  final Map<String, Completer<dynamic>> _pendingRequests = {};

  bool _isConnected = false;
  bool get isConnected => _isConnected;

  Stream<Map<String, dynamic>> get events => _eventController.stream;

  Function()? onConnected;
  Function()? onDisconnected;
  Function(dynamic)? onError;

  GatewayClient({
    this.onConnected,
    this.onDisconnected,
    this.onError,
  });

  Future<void> connect(String url) async {
    if (_isConnected) return;

    try {
      log('Connecting to Gateway: $url');
      String wsUrl = url;
      if (url.startsWith('https://')) {
        wsUrl = url.replaceFirst('https://', 'wss://');
      } else if (url.startsWith('http://')) {
        wsUrl = url.replaceFirst('http://', 'ws://');
      }

      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));

      _channel!.stream.listen(
        (message) {
          _handleMessage(message);
        },
        onDone: () {
          log('Gateway WebSocket Closed');
          _cleanup();
        },
        onError: (error) {
          log('Gateway WebSocket Error: $error');
          if (onError != null) onError!(error);
          _cleanup();
        },
      );

      // Wait for handshake to complete implicitly via events or just mark connected for now
      // The actual "logic" connected state happens after hello-ok, handled in _handleMessage
    } catch (e) {
      log('Gateway Connection Exception: $e');
      if (onError != null) onError!(e);
      _cleanup();
    }
  }

  void _cleanup() {
    _isConnected = false;
    if (onDisconnected != null) onDisconnected!();
    for (var completer in _pendingRequests.values) {
      if (!completer.isCompleted) {
        completer.completeError('Connection closed');
      }
    }
    _pendingRequests.clear();
  }

  void disconnect() {
    if (_channel != null) {
      _channel!.sink.close(status.goingAway);
      _channel = null;
    }
    _cleanup();
  }

  Future<T> request<T>(String method, [Map<String, dynamic>? params]) {
    if (!_isConnected && method != 'connect') {
      // Allow 'connect' even if technically not fully "app-connected" yet,
      // but usually we rely on socket open.
      // Actually, we need the socket open.
      if (_channel == null) {
        return Future.error('Gateway not connected');
      }
    }

    final id = _generateUuid();
    final completer = Completer<T>();
    _pendingRequests[id] = completer;

    final frame = {
      'type': 'req',
      'id': id,
      'method': method,
      'params': params ?? {},
    };

    try {
      _channel!.sink.add(jsonEncode(frame));
    } catch (e) {
      _pendingRequests.remove(id);
      return Future.error(e);
    }

    return completer.future;
  }

  void _handleMessage(dynamic message) {
    if (message is! String) return;

    try {
      final Map<String, dynamic> frame = jsonDecode(message);

      if (frame['type'] == 'event') {
        _handleEvent(frame);
      } else if (frame['type'] == 'res') {
        _handleResponse(frame);
      } else if (frame['type'] == 'hello-ok') {
         // This is the response to our 'connect' request usually,
         // but sometimes sent directly?
         // Actually in the TS code:
         // request('connect') -> returns hello-ok payload.
         // So it might be handled as a 'res' if we sent a request with ID.
         // But if it's a raw hello-ok frame:
         log('Gateway Hello: $frame');
         _isConnected = true;
         if (onConnected != null) onConnected!();
      }
    } catch (e) {
      log('Error parsing gateway message: $e');
    }
  }

  void _handleEvent(Map<String, dynamic> frame) {
    final event = frame['event'];
    final payload = frame['payload'];

    if (event == 'connect.challenge') {
      _handleChallenge(payload);
    } else {
      _eventController.add(frame);
    }
  }

  void _handleResponse(Map<String, dynamic> frame) {
    final id = frame['id'];
    final ok = frame['ok'] == true;
    final payload = frame['payload'];
    final error = frame['error'];

    if (_pendingRequests.containsKey(id)) {
      final completer = _pendingRequests.remove(id)!;
      if (ok) {
        completer.complete(payload);
      } else {
        completer.completeError(error?['message'] ?? 'Unknown gateway error');
      }
    }
  }

  Future<void> _handleChallenge(dynamic payload) async {
    // Respond to challenge with 'connect' request
    // Mimicking the TS client logic

    // We need to send client info
    final params = {
      'minProtocol': 3,
      'maxProtocol': 3,
      'client': {
        'id': 'flutter_client',
        'version': '1.0.0',
        'platform': 'flutter',
        'mode': 'control-ui', // or similar
      },
      'role': 'operator', // Assuming we are operator for now
      'scopes': ['operator.admin'],
      // 'auth': { 'token': ... } // TODO: Add auth support
    };

    // Check if we have a pending connect request?
    // The TS client sends 'connect' request.

    try {
       // We mark connected immediately after sending this?
       // No, wait for hello-ok response.
       final hello = await request('connect', params);
       log('Gateway handshake successful: $hello');
       _isConnected = true;
       if (onConnected != null) onConnected!();
    } catch (e) {
      log('Gateway handshake failed: $e');
      if (onError != null) onError!(e);
      disconnect();
    }
  }

  String _generateUuid() {
    // Simple UUID v4 generator
    final random = math.Random();
    final s = (int n) => (random.nextInt(16)).toRadixString(16);
    return '${s(8)}${s(4)}4${s(3)}a${s(3)}${s(12)}'; // Simplified
  }
}
