import 'package:flutter/material.dart';
import '../utils/theme.dart';

class DreamResultWidget extends StatelessWidget {
  final Map<String, dynamic> result;

  const DreamResultWidget({super.key, required this.result});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
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
          // Header
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
                  size: 16,
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
          
          // Summary
          if (result['summary'] != null) ...[
            _buildSection('夢境概述', result['summary'], Icons.description_outlined),
            const SizedBox(height: 12),
          ],
          
          // Symbols
          if (result['symbols'] != null && (result['symbols'] as List).isNotEmpty) ...[
            _buildSection(
              '象徵符號',
              (result['symbols'] as List).map((s) => '• ${s['symbol']}: ${s['meaning']}').join('\n'),
              Icons.psychology_outlined,
            ),
            const SizedBox(height: 12),
          ],
          
          // Emotions
          if (result['emotions'] != null && (result['emotions'] as List).isNotEmpty) ...[
            _buildSection(
              '情緒分析',
              (result['emotions'] as List).join(', '),
              Icons.mood_outlined,
            ),
            const SizedBox(height: 12),
          ],
          
          // Interpretation
          if (result['interpretation'] != null) ...[
            _buildSection('深層解讀', result['interpretation'], Icons.lightbulb_outlined),
            const SizedBox(height: 12),
          ],
          
          // Advice
          if (result['advice'] != null) ...[
            _buildSection('建議', result['advice'], Icons.tips_and_updates_outlined),
          ],
        ],
      ),
    );
  }

  Widget _buildSection(String title, String content, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: AppTheme.accent2),
            const SizedBox(width: 6),
            Text(
              title,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppTheme.accent2,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          content,
          style: const TextStyle(
            fontSize: 14,
            color: AppTheme.txt,
            height: 1.6,
          ),
        ),
      ],
    );
  }
}

