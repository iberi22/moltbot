import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_client/models/log_entry.dart';
import 'package:flutter_client/services/gateway_client.dart';
import 'package:flutter_client/providers/gateway_provider.dart';
import 'dart:developer';

class LogsState {
  final List<LogEntry> entries;
  final bool loading;
  final String? error;
  final int? cursor;
  final bool truncated;

  LogsState({
    this.entries = const [],
    this.loading = false,
    this.error,
    this.cursor,
    this.truncated = false,
  });

  LogsState copyWith({
    List<LogEntry>? entries,
    bool? loading,
    String? error,
    int? cursor,
    bool? truncated,
  }) {
    return LogsState(
      entries: entries ?? this.entries,
      loading: loading ?? this.loading,
      error: error ?? this.error,
      cursor: cursor ?? this.cursor,
      truncated: truncated ?? this.truncated,
    );
  }
}

class LogsNotifier extends StateNotifier<LogsState> {
  final GatewayClient _client;

  LogsNotifier(this._client) : super(LogsState());

  Future<void> loadLogs({bool reset = false}) async {
    if (!_client.isConnected) return;

    // Only set loading if not tailing quietly
    if (reset) {
       state = state.copyWith(loading: true, error: null);
    }

    try {
      final res = await _client.request('logs.tail', {
        'cursor': reset ? null : state.cursor,
        'limit': 200,
        'maxBytes': 100000,
      });

      if (res is Map) {
        final lines = (res['lines'] as List?)?.cast<String>() ?? [];
        final cursor = res['cursor'] as int?;
        final truncated = res['truncated'] == true;
        final wasReset = res['reset'] == true;

        final newEntries = lines.map(_parseLogLine).toList();

        final currentEntries = (reset || wasReset) ? <LogEntry>[] : state.entries;

        state = state.copyWith(
          entries: [...currentEntries, ...newEntries], // Append
          cursor: cursor,
          truncated: truncated,
          loading: false,
        );
      }
    } catch (e) {
      log('Logs load failed: $e');
      state = state.copyWith(error: e.toString(), loading: false);
    }
  }

  LogEntry _parseLogLine(String line) {
    try {
      final json = jsonDecode(line);
      if (json is Map<String, dynamic>) {
        // Try to extract standard bunyan/pino fields
        final time = json['time'] ?? (json['_meta']?['date']);
        final level = json['level'] ?? (json['_meta']?['logLevelName']);
        final msg = json['msg'] ?? json['message'] ?? json['1'] ?? line;
        final name = json['name'] ?? (json['_meta']?['name']);

        return LogEntry(
          raw: line,
          time: time?.toString(),
          level: level?.toString(),
          subsystem: name?.toString(),
          message: msg?.toString(),
        );
      }
    } catch (_) {
      // Not JSON
    }
    return LogEntry(raw: line, message: line);
  }
}

final logsProvider = StateNotifierProvider<LogsNotifier, LogsState>((ref) {
  final client = ref.watch(gatewayClientProvider);
  return LogsNotifier(client);
});
