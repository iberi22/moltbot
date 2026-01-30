import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_client/providers/chat_provider.dart';
import 'package:flutter_client/theme/app_theme.dart';
import 'package:flutter_client/models/chat_message.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  void _handleSubmitted() {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    ref.read(chatProvider.notifier).sendMessage(text);
    _textController.clear();
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProvider);

    // Scroll to bottom when new messages arrive
    ref.listen(chatProvider, (previous, next) {
      if (next.messages.length > (previous?.messages.length ?? 0)) {
        _scrollToBottom();
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Moltbot Chat'),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: chatState.status == ConnectionStatus.connected
                  ? Colors.green
                  : chatState.status == ConnectionStatus.error
                      ? Colors.red
                      : Colors.orange,
            ),
          )
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: chatState.messages.isEmpty
                ? Center(
                    child: Text(
                      'No messages yet',
                      style: TextStyle(color: AppTheme.muted),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: chatState.messages.length,
                    itemBuilder: (context, index) {
                      final message = chatState.messages[index];
                      return _ChatMessageItem(message: message);
                    },
                  ),
          ),
          _buildInputArea(chatState.status == ConnectionStatus.connected),
        ],
      ),
    );
  }

  Widget _buildInputArea(bool isConnected) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bg,
        border: Border(top: BorderSide(color: AppTheme.border)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _textController,
              enabled: isConnected,
              onSubmitted: (_) => _handleSubmitted(),
              decoration: InputDecoration(
                hintText: isConnected ? 'Type a message...' : 'Connecting...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: AppTheme.input,
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: isConnected ? _handleSubmitted : null,
            icon: Icon(
              Icons.send_rounded,
              color: isConnected ? AppTheme.accent : AppTheme.muted,
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatMessageItem extends StatelessWidget {
  final ChatMessage message;

  const _ChatMessageItem({required this.message});

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
             const CircleAvatar(
               backgroundColor: AppTheme.accent,
               radius: 16,
               child: Text('AI', style: TextStyle(color: Colors.white, fontSize: 12)),
             ),
             const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isUser ? AppTheme.accent.withOpacity(0.1) : AppTheme.card,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: isUser ? const Radius.circular(16) : const Radius.circular(4),
                  bottomRight: isUser ? const Radius.circular(4) : const Radius.circular(16),
                ),
                border: isUser
                    ? Border.all(color: AppTheme.accent.withOpacity(0.3))
                    : Border.all(color: AppTheme.border),
              ),
              child: MarkdownBody(
                data: message.text,
                styleSheet: MarkdownStyleSheet(
                  p: TextStyle(color: AppTheme.text, fontSize: 15, height: 1.5),
                  code: GoogleFonts.jetbrainsMono(
                    backgroundColor: AppTheme.bg,
                    color: AppTheme.text,
                  ),
                  codeblockDecoration: BoxDecoration(
                    color: AppTheme.bg,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
          ),
          if (isUser) ...[
             const SizedBox(width: 8),
             const CircleAvatar(
               backgroundColor: AppTheme.input,
               radius: 16,
               child: Icon(Icons.person, size: 16, color: AppTheme.muted),
             ),
          ],
        ],
      ),
    );
  }
}
