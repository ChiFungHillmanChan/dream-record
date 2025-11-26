import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../utils/theme.dart';

class WeeklyReportsScreen extends StatefulWidget {
  const WeeklyReportsScreen({super.key});

  @override
  State<WeeklyReportsScreen> createState() => _WeeklyReportsScreenState();
}

class _WeeklyReportsScreenState extends State<WeeklyReportsScreen> {
  List<dynamic> _reports = [];
  bool _isLoading = true;
  bool _isGenerating = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final api = context.read<ApiService>();
      final reports = await api.getWeeklyReports();
      setState(() {
        _reports = reports;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _generateReport() async {
    setState(() => _isGenerating = true);

    try {
      final api = context.read<ApiService>();
      await api.generateWeeklyReport();
      await _loadReports();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('生成失敗: $e'),
            backgroundColor: AppTheme.danger,
          ),
        );
      }
    } finally {
      setState(() => _isGenerating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '週報',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.txt,
                            ),
                          ),
                          Text(
                            '你的夢境週報分析',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.muted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Generate button
                    Container(
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppTheme.accent, AppTheme.accent2],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: _isGenerating ? null : _generateReport,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 10,
                            ),
                            child: _isGenerating
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.auto_awesome,
                                        size: 16,
                                        color: Colors.white,
                                      ),
                                      SizedBox(width: 6),
                                      Text(
                                        '生成週報',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ],
                                  ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              // Content
              Expanded(
                child: _isLoading
                    ? const Center(
                        child: CircularProgressIndicator(color: AppTheme.accent),
                      )
                    : _error != null
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  Icons.error_outline,
                                  size: 48,
                                  color: AppTheme.danger,
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  '載入失敗',
                                  style: TextStyle(
                                    color: AppTheme.danger,
                                    fontSize: 16,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                TextButton(
                                  onPressed: _loadReports,
                                  child: const Text('重試'),
                                ),
                              ],
                            ),
                          )
                        : _reports.isEmpty
                            ? Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Text(
                                      '✨',
                                      style: TextStyle(fontSize: 48),
                                    ),
                                    const SizedBox(height: 16),
                                    const Text(
                                      '尚無週報',
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.txt,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    const Text(
                                      '記錄更多夢境後，生成你的第一份週報吧！',
                                      style: TextStyle(
                                        color: AppTheme.muted,
                                        fontSize: 14,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              )
                            : ListView.builder(
                                padding: const EdgeInsets.all(12),
                                itemCount: _reports.length,
                                itemBuilder: (context, index) {
                                  final report = _reports[index];
                                  return _buildReportCard(report);
                                },
                              ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReportCard(dynamic report) {
    final createdAt = DateTime.parse(report['createdAt']);
    final dateStr = DateFormat('yyyy年M月d日').format(createdAt);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        shape: const Border(),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.accent.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.auto_awesome,
                size: 20,
                color: AppTheme.accent,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '週報 #${_reports.length - _reports.indexOf(report)}',
                    style: const TextStyle(
                      fontSize: 16,
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
          ],
        ),
        iconColor: AppTheme.muted,
        collapsedIconColor: AppTheme.muted,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF0F1230),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              report['content'] ?? '無內容',
              style: const TextStyle(
                color: AppTheme.txt,
                fontSize: 14,
                height: 1.6,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
