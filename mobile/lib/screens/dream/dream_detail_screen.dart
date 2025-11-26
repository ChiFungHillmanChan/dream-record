import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/dream_provider.dart';
import '../../utils/theme.dart';
import '../../widgets/dream_chip.dart';
import '../../widgets/dream_result.dart';

class DreamDetailScreen extends StatefulWidget {
  final String dreamId;

  const DreamDetailScreen({super.key, required this.dreamId});

  @override
  State<DreamDetailScreen> createState() => _DreamDetailScreenState();
}

class _DreamDetailScreenState extends State<DreamDetailScreen> {
  bool _isDeleting = false;

  @override
  Widget build(BuildContext context) {
    return Consumer<DreamProvider>(
      builder: (context, provider, _) {
        final dream = provider.dreams.where((d) => d.id == widget.dreamId).firstOrNull;

        if (dream == null) {
          return Scaffold(
            body: GradientBackground(
              child: SafeArea(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        '🌙',
                        style: TextStyle(fontSize: 48),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        '找不到這個夢境',
                        style: TextStyle(
                          fontSize: 18,
                          color: AppTheme.txt,
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: () => context.go('/'),
                        child: const Text('返回首頁'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }

        final createdAt = dream.createdAt;
        final dateStr = DateFormat('yyyy年M月d日 HH:mm').format(createdAt);

        return Scaffold(
          body: GradientBackground(
            child: SafeArea(
              child: Column(
                children: [
                  // Header
                  Container(
                    margin: const EdgeInsets.all(12),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Row(
                      children: [
                        IconButton(
                          onPressed: () => context.go('/'),
                          icon: const Icon(Icons.arrow_back, color: AppTheme.muted),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                dream.type == 'dream' ? '夢境記錄' : '無夢記錄',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.txt,
                                ),
                              ),
                              Text(
                                dateStr,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.muted,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Delete button
                        IconButton(
                          onPressed: _isDeleting ? null : () => _showDeleteConfirm(context, provider),
                          icon: _isDeleting
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppTheme.danger,
                                  ),
                                )
                              : const Icon(
                                  Icons.delete_outline,
                                  color: AppTheme.danger,
                                ),
                        ),
                      ],
                    ),
                  ),

                  // Content
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Dream content
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: AppTheme.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppTheme.border),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Type badge
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 5,
                                  ),
                                  decoration: BoxDecoration(
                                    color: dream.type == 'dream'
                                        ? AppTheme.accent.withOpacity(0.2)
                                        : Colors.white.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    dream.type == 'dream' ? '🌙 夢境' : '😴 無夢',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: dream.type == 'dream'
                                          ? AppTheme.accent
                                          : AppTheme.muted,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 16),

                                // Content
                                Text(
                                  dream.content,
                                  style: const TextStyle(
                                    color: AppTheme.txt,
                                    fontSize: 16,
                                    height: 1.8,
                                  ),
                                ),

                                // Tags
                                if (dream.tags != null && dream.tags!.isNotEmpty) ...[
                                  const SizedBox(height: 20),
                                  const Divider(color: AppTheme.border),
                                  const SizedBox(height: 12),
                                  const Text(
                                    '夢境印記',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.muted,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: dream.tags!
                                        .map((tag) => DreamChip(
                                              label: tag,
                                              isActive: true,
                                            ))
                                        .toList(),
                                  ),
                                ],
                              ],
                            ),
                          ),

                          // Analysis section
                          if (dream.analysis != null) ...[
                            const SizedBox(height: 16),
                            _buildAnalysisSection(dream.analysis!),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildAnalysisSection(String analysisJson) {
    // Try to parse analysis as JSON
    Map<String, dynamic>? analysis;
    try {
      // Simple parsing - in production, use proper JSON decode
      if (analysisJson.startsWith('{')) {
        // This is a simplified version - actual implementation would use json.decode
        analysis = {'raw': analysisJson};
      }
    } catch (_) {
      analysis = null;
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.accent.withOpacity(0.1),
            AppTheme.accent2.withOpacity(0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.accent.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.accent.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.auto_awesome,
                  size: 18,
                  color: AppTheme.accent,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                '天機解讀',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.txt,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            analysisJson,
            style: const TextStyle(
              color: AppTheme.txt,
              fontSize: 14,
              height: 1.7,
            ),
          ),
        ],
      ),
    );
  }

  void _showDeleteConfirm(BuildContext context, DreamProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: const Text(
          '刪除夢境',
          style: TextStyle(color: AppTheme.txt),
        ),
        content: const Text(
          '確定要刪除這個夢境記錄嗎？此操作無法復原。',
          style: TextStyle(color: AppTheme.muted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              setState(() => _isDeleting = true);
              
              final success = await provider.deleteDream(widget.dreamId);
              
              if (success && context.mounted) {
                context.go('/');
              } else {
                setState(() => _isDeleting = false);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.danger,
            ),
            child: const Text('刪除'),
          ),
        ],
      ),
    );
  }
}
