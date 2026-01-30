import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_client/models/overview_state.dart';
import 'package:flutter_client/services/gateway_client.dart';
import 'package:flutter_client/providers/gateway_provider.dart';
import 'dart:developer';

class OverviewNotifier extends StateNotifier<OverviewState> {
  final GatewayClient _client;

  OverviewNotifier(this._client) : super(OverviewState());

  Future<void> loadOverview() async {
    if (!_client.isConnected) return;

    state = state.copyWith(loading: true, error: null);

    try {
      final presenceFuture = _client.request('system-presence', {});
      final channelsFuture = _client.request('channels.status', {'probe': false});

      final results = await Future.wait([presenceFuture, channelsFuture]);

      final presence = results[0] as List<dynamic>? ?? [];
      final channels = results[1] as Map<String, dynamic>? ?? {};

      state = state.copyWith(
        presence: presence,
        channels: channels,
        loading: false,
      );
    } catch (e) {
      log('Overview load failed: $e');
      state = state.copyWith(
        error: e.toString(),
        loading: false,
      );
    }
  }
}

final overviewProvider = StateNotifierProvider<OverviewNotifier, OverviewState>((ref) {
  final client = ref.watch(gatewayClientProvider);
  return OverviewNotifier(client);
});
