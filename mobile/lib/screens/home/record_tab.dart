import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/dream_provider.dart';
import '../../utils/theme.dart';
import '../../widgets/dream_chip.dart';
import '../../widgets/dream_loading.dart';
import '../../widgets/dream_result.dart';

class RecordTab extends StatefulWidget {
  const RecordTab({super.key});

  @override
  State<RecordTab> createState() => _RecordTabState();
}

class _RecordTabState extends State<RecordTab> {
  final _textController = TextEditingController();
  final Set<String> _selectedTags = {};
  bool _showTagManager = false;
  bool _showClearConfirm = false;
  
  // Available tags (would be stored in local storage in production)
  List<String> _availableTags = ['開心', '可怕', '親情', '奇幻', '戀愛'];
  static const List<String> _allPresetTags = [
    '開心', '可怕', '感動', '親情', '離世', '奇幻', '追逐', 
    '飛翔', '戀愛', '工作', '考試', '清醒夢', '噩夢', '搞笑'
  ];

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _handleAnalyze() async {
    if (_textController.text.trim().isEmpty) return;
    
    final provider = context.read<DreamProvider>();
    await provider.analyzeDream(_textController.text);
  }

  void _handleSave() async {
    if (_textController.text.trim().isEmpty) return;
    
    final provider = context.read<DreamProvider>();
    await provider.saveDream(
      content: _textController.text,
      tags: _selectedTags.toList(),
      type: 'dream',
    );
    
    if (mounted) {
      _textController.clear();
      _selectedTags.clear();
      provider.clearAnalysis();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('夢境已封存'),
          backgroundColor: AppTheme.ok,
        ),
      );
    }
  }

  void _clearAll() {
    _textController.clear();
    context.read<DreamProvider>().clearAnalysis();
    setState(() {
      _showClearConfirm = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        SingleChildScrollView(
          padding: const EdgeInsets.all(12),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '捕捉殘片',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.txt,
                  ),
                ),
                const SizedBox(height: 12),
                
                // Text input
                TextField(
                  controller: _textController,
                  maxLines: 6,
                  style: const TextStyle(color: AppTheme.txt),
                  decoration: InputDecoration(
                    hintText: '在意識模糊之際，你記起了什麼...？',
                    hintStyle: TextStyle(color: AppTheme.muted.withOpacity(0.7)),
                    filled: true,
                    fillColor: const Color(0xFF0F1230),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.border),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.border),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.accent2),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                
                // Action buttons
                Consumer<DreamProvider>(
                  builder: (context, provider, _) {
                    return Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        // Voice recording button
                        _buildActionButton(
                          icon: Icons.mic,
                          label: provider.isRecording 
                              ? '停止錄音' 
                              : provider.isTranscribing 
                                  ? '轉換中...' 
                                  : '錄音口述',
                          isActive: provider.isRecording,
                          isLoading: provider.isTranscribing,
                          gradient: !provider.isRecording && !provider.isTranscribing
                              ? const LinearGradient(colors: [Color(0xFF67E8F9), AppTheme.accent])
                              : null,
                          borderColor: provider.isRecording 
                              ? AppTheme.danger.withOpacity(0.5) 
                              : null,
                          onTap: () async {
                            if (provider.isRecording) {
                              final text = await provider.stopRecording();
                              if (text != null && text.isNotEmpty) {
                                _textController.text += (_textController.text.isEmpty ? '' : ' ') + text;
                              }
                            } else {
                              await provider.startRecording();
                            }
                          },
                        ),
                        
                        // Clear button
                        _buildActionButton(
                          icon: Icons.delete_outline,
                          label: '遺忘',
                          onTap: () {
                            if (_textController.text.isNotEmpty || provider.analysisResult != null) {
                              setState(() => _showClearConfirm = true);
                            }
                          },
                        ),
                        
                        // Analyze button
                        _buildActionButton(
                          icon: Icons.auto_awesome,
                          label: provider.isAnalyzing ? '感應中...' : '解讀天機',
                          isLoading: provider.isAnalyzing,
                          gradient: const LinearGradient(
                            colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                          ),
                          onTap: provider.isAnalyzing ? null : _handleAnalyze,
                        ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 16),
                
                // Analysis result
                Consumer<DreamProvider>(
                  builder: (context, provider, _) {
                    if (provider.analysisResult != null) {
                      return Column(
                        children: [
                          DreamResultWidget(result: provider.analysisResult!),
                          const SizedBox(height: 16),
                        ],
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
                
                // Tags section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      '夢境印記',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFFEAEAFF),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => setState(() => _showTagManager = true),
                      child: const Text(
                        '編織',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.accent,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ..._availableTags.map((tag) => DreamChip(
                      label: tag,
                      isActive: _selectedTags.contains(tag),
                      onTap: () {
                        setState(() {
                          if (_selectedTags.contains(tag)) {
                            _selectedTags.remove(tag);
                          } else {
                            _selectedTags.add(tag);
                          }
                        });
                      },
                    )),
                    // Custom tag input
                    GestureDetector(
                      onTap: _showCustomTagDialog,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: AppTheme.muted,
                            style: BorderStyle.solid,
                          ),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.add, size: 14, color: AppTheme.muted),
                            SizedBox(width: 4),
                            Text(
                              '自訂',
                              style: TextStyle(color: AppTheme.muted, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                
                // Save button
                SizedBox(
                  width: double.infinity,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.accent, AppTheme.accent2],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.accent.withOpacity(0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ElevatedButton.icon(
                      onPressed: _handleSave,
                      icon: const Icon(Icons.save_alt, size: 18),
                      label: const Text('封存夢境'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        
        // Tag Manager Modal
        if (_showTagManager) _buildTagManagerModal(),
        
        // Clear Confirm Modal
        if (_showClearConfirm) _buildClearConfirmModal(),

        // Loading Overlay
        Consumer<DreamProvider>(
          builder: (context, provider, _) {
            if (provider.isAnalyzing || provider.isTranscribing) {
              return const DreamLoading();
            }
            return const SizedBox.shrink();
          },
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    VoidCallback? onTap,
    bool isActive = false,
    bool isLoading = false,
    Gradient? gradient,
    Color? borderColor,
  }) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          gradient: gradient,
          color: gradient == null 
              ? (isActive ? AppTheme.danger.withOpacity(0.2) : null) 
              : null,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: borderColor ?? AppTheme.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isLoading)
              const SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            else
              Icon(icon, size: 14, color: gradient != null ? const Color(0xFF001111) : AppTheme.muted),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: gradient != null ? const Color(0xFF001111) : AppTheme.muted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCustomTagDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('新增印記', style: TextStyle(color: AppTheme.txt)),
        content: TextField(
          controller: controller,
          autofocus: true,
          style: const TextStyle(color: AppTheme.txt),
          decoration: const InputDecoration(
            hintText: '輸入印記名稱...',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () {
              final tag = controller.text.trim();
              if (tag.isNotEmpty) {
                setState(() {
                  _selectedTags.add(tag);
                  if (!_availableTags.contains(tag)) {
                    _availableTags.add(tag);
                  }
                });
              }
              Navigator.pop(context);
            },
            child: const Text('加入'),
          ),
        ],
      ),
    );
  }

  Widget _buildTagManagerModal() {
    return GestureDetector(
      onTap: () => setState(() => _showTagManager = false),
      child: Container(
        color: Colors.black.withOpacity(0.8),
        child: Center(
          child: GestureDetector(
            onTap: () {}, // Prevent closing when tapping modal content
            child: Container(
              margin: const EdgeInsets.all(24),
              padding: const EdgeInsets.all(24),
              constraints: const BoxConstraints(maxWidth: 400),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.border),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        '編織常用印記',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.txt,
                        ),
                      ),
                      IconButton(
                        onPressed: () => setState(() => _showTagManager = false),
                        icon: const Icon(Icons.close, color: AppTheme.muted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Current tags
                  const Text(
                    '已鐫刻印記 (點擊抹去)',
                    style: TextStyle(fontSize: 12, color: AppTheme.muted),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _availableTags.map((tag) => GestureDetector(
                      onTap: () {
                        setState(() {
                          _availableTags.remove(tag);
                          _selectedTags.remove(tag);
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.white.withOpacity(0.1)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(tag, style: const TextStyle(fontSize: 13, color: AppTheme.txt)),
                            const SizedBox(width: 4),
                            const Icon(Icons.close, size: 12, color: AppTheme.muted),
                          ],
                        ),
                      ),
                    )).toList(),
                  ),
                  const SizedBox(height: 20),
                  
                  // Preset tags
                  const Text(
                    '共鳴印記 (點擊鐫刻)',
                    style: TextStyle(fontSize: 12, color: AppTheme.muted),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _allPresetTags
                        .where((t) => !_availableTags.contains(t))
                        .map((tag) => GestureDetector(
                      onTap: () {
                        setState(() {
                          _availableTags.add(tag);
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: AppTheme.muted,
                            style: BorderStyle.solid,
                          ),
                        ),
                        child: Text(
                          '+ $tag',
                          style: const TextStyle(fontSize: 13, color: AppTheme.muted),
                        ),
                      ),
                    )).toList(),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildClearConfirmModal() {
    return GestureDetector(
      onTap: () => setState(() => _showClearConfirm = false),
      child: Container(
        color: Colors.black.withOpacity(0.6),
        child: Center(
          child: GestureDetector(
            onTap: () {},
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(24),
              constraints: const BoxConstraints(maxWidth: 350),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF1A1D3D), Color(0xFF0F1230)],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.5),
                    blurRadius: 20,
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Icon
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [
                          Colors.amber.withOpacity(0.2),
                          Colors.orange.withOpacity(0.2),
                        ],
                      ),
                    ),
                    child: const Center(
                      child: Text('🗑️', style: TextStyle(fontSize: 28)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  const Text(
                    '等等...',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    '你確定要讓這些記憶煙消雲散？\n一旦遺忘，就再也找不回這些碎片了。',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.slate400,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => setState(() => _showClearConfirm = false),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            side: const BorderSide(color: AppTheme.border),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            '保留記憶',
                            style: TextStyle(color: Color(0xFFD1D5DB)), // slate-300
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFDC2626), Color(0xFFEA580C)],
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: ElevatedButton(
                            onPressed: _clearAll,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              shadowColor: Colors.transparent,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text(
                              '徹底遺忘 💨',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
