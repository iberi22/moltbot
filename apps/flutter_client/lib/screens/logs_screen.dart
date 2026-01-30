import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_client/providers/logs_provider.dart';
import 'package:flutter_client/theme/app_theme.dart';
import 'package:google_fonts/google_fonts.dart';

class LogsScreen extends ConsumerStatefulWidget {
  const LogsScreen({super.key});

  @override
  ConsumerState<LogsScreen> createState() => _LogsScreenState();
}

class _LogsScreenState extends ConsumerState<LogsScreen> {
  final ScrollController _scrollController = ScrollController();
  bool _autoFollow = true;

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(logsProvider);

    // Auto-scroll
    if (_autoFollow && state.entries.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
        }
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Logs'),
        actions: [
          IconButton(
            icon: Icon(_autoFollow ? Icons.vertical_align_bottom : Icons.pause),
            tooltip: _autoFollow ? 'Auto-scroll ON' : 'Auto-scroll OFF',
            onPressed: () {
              setState(() {
                _autoFollow = !_autoFollow;
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(logsProvider.notifier).loadLogs(reset: true);
            },
          ),
        ],
      ),
      backgroundColor: Colors.black, // Terminal look
      body: state.loading && state.entries.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : state.error != null
              ? Center(child: Text('Error: ${state.error}', style: const TextStyle(color: Colors.red)))
              : ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(8),
                  itemCount: state.entries.length,
                  itemBuilder: (context, index) {
                    final entry = state.entries[index];
                    return _LogItem(entry: entry);
                  },
                ),
    );
  }
}

class _LogItem extends StatelessWidget {
  final LogEntry entry;

  const _LogItem({required this.entry});

  @override
  Widget build(BuildContext context) {
    Color color = Colors.grey;
    if (entry.level == 'info') color = Colors.blueAccent;
    if (entry.level == 'warn') color = Colors.orangeAccent;
    if (entry.level == 'error') color = Colors.redAccent;
    if (entry.level == 'debug') color = Colors.greenAccent;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: RichText(
        text: TextSpan(
          style: GoogleFonts.jetbrainsMono(fontSize: 12, color: AppTheme.text),
          children: [
            if (entry.time != null)
              TextSpan(
                text: '[${_formatTime(entry.time!)}] ',
                style: const TextStyle(color: Colors.grey),
              ),
            if (entry.level != null)
              TextSpan(
                text: '${entry.level!.toUpperCase()} ',
                style: TextStyle(color: color, fontWeight: FontWeight.bold),
              ),
            if (entry.subsystem != null)
              TextSpan(
                text: '${entry.subsystem}: ',
                style: const TextStyle(color: Colors.cyan),
              ),
            TextSpan(text: entry.message ?? entry.raw),
          ],
        ),
      ),
    );
  }

  String _formatTime(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}:${dt.second.toString().padLeft(2, '0')}';
    } catch (_) {
      return iso;
    }
  }
}
