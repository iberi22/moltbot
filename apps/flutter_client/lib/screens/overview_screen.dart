import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_client/providers/overview_provider.dart';
import 'package:flutter_client/theme/app_theme.dart';

class OverviewScreen extends ConsumerStatefulWidget {
  const OverviewScreen({super.key});

  @override
  ConsumerState<OverviewScreen> createState() => _OverviewScreenState();
}

class _OverviewScreenState extends ConsumerState<OverviewScreen> {
  @override
  void initState() {
    super.initState();
    // Assuming the client is set by the parent or handled globally
    // For now, we need to manually trigger load or check connectivity
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(overviewProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Overview'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(overviewProvider.notifier).loadOverview();
            },
          ),
        ],
      ),
      body: state.loading
          ? const Center(child: CircularProgressIndicator())
          : state.error != null
              ? Center(child: Text('Error: ${state.error}', style: TextStyle(color: AppTheme.accent)))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    _buildStatusCard(
                      'System Presence',
                      state.presence.isEmpty ? 'No instances' : '${state.presence.length} Connected',
                      state.presence.isEmpty ? Colors.orange : Colors.green,
                      Icons.monitor_heart,
                    ),
                    const SizedBox(height: 16),
                    _buildStatusCard(
                      'Channels',
                      '${state.channels?.length ?? 0} Configured',
                      Colors.blue,
                      Icons.link,
                    ),
                    // Add more details from channels
                    if (state.channels != null) ...[
                      const SizedBox(height: 16),
                      Text('Channel Status', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      ...state.channels!.entries.map((e) {
                         final status = e.value['status'] ?? 'unknown';
                         return Card(
                           child: ListTile(
                             title: Text(e.key.toUpperCase()),
                             subtitle: Text(status),
                             leading: Icon(Icons.circle, size: 12, color: status == 'ok' ? Colors.green : Colors.grey),
                           ),
                         );
                      }).toList(),
                    ]
                  ],
                ),
    );
  }

  Widget _buildStatusCard(String title, String value, Color color, IconData icon) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: AppTheme.card,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: AppTheme.muted, fontSize: 14)),
                const SizedBox(height: 4),
                Text(value, style: TextStyle(color: AppTheme.textStrong, fontSize: 20, fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
