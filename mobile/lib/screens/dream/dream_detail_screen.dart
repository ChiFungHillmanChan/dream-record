import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/dream_provider.dart';
import '../../models/dream.dart';
import '../../utils/theme.dart';
import '../../widgets/tag_chip.dart';

class DreamDetailScreen extends StatefulWidget {
  final String dreamId;

  const DreamDetailScreen({super.key, required this.dreamId});

  @override
  State<DreamDetailScreen> createState() => _DreamDetailScreenState();
}

class _DreamDetailScreenState extends State<DreamDetailScreen> {
  Dream? _dream;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDream();
  }

  Future<void> _loadDream() async {
    final dreams = context.read<DreamProvider>();
    final dream = await dreams.getDream(widget.dreamId);
    setState(() {
      _dream = dream;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_dream == null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.go('/'),
          ),
        ),
        body: const Center(
          child: Text('找不到此夢境紀錄'),
        ),
      );
    }

    final dream = _dream!;
    final date = DateTime.parse(dream.date);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/'),
        ),
        title: Text(DateFormat('yyyy年M月d日').format(date)),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  backgroundColor: AppTheme.surface,
                  title: const Text('確認刪除'),
                  content: const Text('確定要刪除此筆紀錄嗎？'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('取消'),
                    ),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.danger,
                      ),
                      child: const Text('刪除'),
                    ),
                  ],
                ),
              );
              if (confirmed == true && mounted) {
                final dreams = context.read<DreamProvider>();
                await dreams.deleteDream(dream.id);
                if (mounted) context.go('/');
              }
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Type badge
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: dream.isDream 
                        ? AppTheme.primary.withOpacity(0.2)
                        : Colors.grey.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    dream.isDream ? '✨ 夢境' : '😴 無夢',
                    style: TextStyle(
                      color: dream.isDream ? AppTheme.primary : Colors.grey,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  DateFormat('HH:mm').format(dream.createdAt),
                  style: const TextStyle(color: AppTheme.muted),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Content
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  dream.content,
                  style: const TextStyle(
                    fontSize: 16,
                    height: 1.6,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Tags
            if (dream.tags.isNotEmpty) ...[
              const Text(
                '夢境印記',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.muted,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: dream.tags.map((tag) => TagChip(
                  label: tag,
                  selected: true,
                )).toList(),
              ),
              const SizedBox(height: 24),
            ],

            // Analysis
            if (dream.hasAnalysis && dream.analysis != null) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withOpacity(0.2),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.auto_awesome,
                              size: 16,
                              color: AppTheme.primary,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'AI 夢境解析報告',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.accent,
                                  ),
                                ),
                                Text(
                                  '深度分析您的潛意識',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppTheme.muted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Divider(color: AppTheme.border),
                      const SizedBox(height: 16),

                      // Summary
                      _AnalysisSection(
                        title: '摘要',
                        content: dream.analysis!.summary,
                      ),
                      const SizedBox(height: 16),

                      // Vibe
                      _AnalysisSection(
                        title: '氛圍',
                        content: dream.analysis!.vibe,
                      ),

                      // Deep analysis (if available)
                      if (dream.analysis!.analysis != null && 
                          dream.analysis!.analysis!.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const Text(
                          '深度解析',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.muted,
                          ),
                        ),
                        const SizedBox(height: 8),
                        ...dream.analysis!.analysis!.map((section) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _AnalysisSection(
                            title: section.title,
                            content: section.content,
                          ),
                        )),
                      ],

                      // Reflection (if available)
                      if (dream.analysis!.reflection != null && 
                          dream.analysis!.reflection!.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        _AnalysisSection(
                          title: '反思',
                          content: dream.analysis!.reflection!,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ] else if (dream.isDream) ...[
              // No analysis - show upgrade prompt
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Icon(
                        Icons.lock_outline,
                        size: 48,
                        color: AppTheme.muted.withOpacity(0.5),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        '此夢境尚未解析',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        '使用 AI 解讀功能探索您的潛意識',
                        style: TextStyle(
                          color: AppTheme.muted,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _AnalysisSection extends StatelessWidget {
  final String title;
  final String content;

  const _AnalysisSection({
    required this.title,
    required this.content,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceSoft,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppTheme.muted,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            content,
            style: const TextStyle(
              fontSize: 14,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

