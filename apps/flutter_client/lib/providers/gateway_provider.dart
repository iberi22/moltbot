import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_client/services/gateway_client.dart';

final gatewayClientProvider = Provider<GatewayClient>((ref) {
  return GatewayClient();
});
