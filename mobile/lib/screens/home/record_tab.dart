import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dream_provider.dart';
import '../../utils/theme.dart';
import '../../utils/constants.dart';
import '../../widgets/tag_chip.dart';

class RecordTab extends StatefulWidget {
  const RecordTab({super.key});

  @override
  State<RecordTab> createState() => _RecordTabState();
}

class _RecordTabState extends State<RecordTab> {
  final _textController = TextEditingController();
  final _customTagController = TextEditingController();
  final _recorder = AudioRecorder();
  
  Set<String> _selectedTags = {};
  List<String> _availableTags = AppConstants.defaultTags;
  bool _isRecording = false;
  String? _recordingPath;

  @override
  void dispose() {
    _textController.dispose();
    _customTagController.dispose();
    _recorder.dispose();
    super.dispose();
  }

  Future<void> _toggleRecording() async {
    if (_isRecording) {
      // Stop recording
      final path = await _recorder.stop();
      setState(() {
        _isRecording = false;
        _recordingPath = path;
      });
      
      // Transcribe if we have a recording
      if (path != null) {
        final dreams = context.read<DreamProvider>();
        final text = await dreams.transcribeAudio(File(path));
        if (text != null) {
          _textController.text = _textController.text + text;
        }
      }
    } else {
      // Check permission and start recording
      if (await _recorder.hasPermission()) {
        final dir = await getTemporaryDirectory();
        final path = '${dir.path}/dream_recording_${DateTime.now().millisecondsSinceEpoch}.m4a';
        
        await _recorder.start(
          const RecordConfig(encoder: AudioEncoder.aacLc),
          path: path,
        );
        setState(() {
          _isRecording = true;
        });
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('請允許麥克風權限')),
          );
        }
      }
    }
  }

  Future<void> _saveDream(String type) async {
    final content = _textController.text.trim();
    
    if (type == 'dream' && content.isEmpty && _selectedTags.isEmpty) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: AppTheme.surface,
          title: const Text('確認'),
          content: const Text('內容與標籤皆為空，仍要保存嗎？'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('取消'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('保存'),
            ),
          ],
        ),
      );
      if (confirmed != true) return;
    }

    final dreams = context.read<DreamProvider>();
    final date = DateTime.now();
    final dateStr = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

    final success = await dreams.saveDream(
      content: type == 'no_dream' ? '今天竟沒有發夢（或是忘了）' : content,
      type: type,
      date: dateStr,
      tags: _selectedTags.toList(),
    );

    if (success && mounted) {
      _textController.clear();
      setState(() {
        _selectedTags = {};
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(type == 'dream' ? '夢境已封存 🔮' : '已記錄無夢 🌑'),
          backgroundColor: AppTheme.primary,
        ),
      );
    }
  }

  Future<void> _analyzeDream() async {
    final content = _textController.text.trim();
    if (content.isEmpty) return;

    final dreams = context.read<DreamProvider>();
    final result = await dreams.analyzeDream(content);

    if (result != null && mounted) {
      // Save with analysis
      final date = DateTime.now();
      final dateStr = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

      await dreams.saveDream(
        content: content,
        type: 'dream',
        date: dateStr,
        tags: _selectedTags.toList(),
        analysis: result.toJson().toString(),
      );

      _textController.clear();
      setState(() {
        _selectedTags = {};
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('夢境已解析並封存 ✨'),
          backgroundColor: AppTheme.primary,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Dream input card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '捕捉殘片',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Text input
                  TextField(
                    controller: _textController,
                    maxLines: 6,
                    decoration: const InputDecoration(
                      hintText: '在意識模糊之際，你記起了什麼...？',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Action buttons
                  Row(
                    children: [
                      // Voice recording button
                      Consumer<DreamProvider>(
                        builder: (context, dreams, _) {
                          final isTranscribing = dreams.isTranscribing;
                          return ElevatedButton.icon(
                            onPressed: isTranscribing ? null : _toggleRecording,
                            icon: Icon(
                              isTranscribing 
                                  ? Icons.hourglass_empty
                                  : _isRecording 
                                      ? Icons.stop 
                                      : Icons.mic,
                            ),
                            label: Text(
                              isTranscribing 
                                  ? '轉換中...'
                                  : _isRecording 
                                      ? '停止錄音' 
                                      : '錄音口述',
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _isRecording 
                                  ? AppTheme.danger 
                                  : AppTheme.accent,
                            ),
                          );
                        },
                      ),
                      const SizedBox(width: 8),
                      
                      // Clear button
                      OutlinedButton(
                        onPressed: () {
                          _textController.clear();
                          setState(() {
                            _selectedTags = {};
                          });
                        },
                        child: const Text('遺忘'),
                      ),
                      const Spacer(),
                      
                      // Analyze button
                      Consumer2<DreamProvider, AuthProvider>(
                        builder: (context, dreams, auth, _) {
                          final remaining = auth.user?.remainingAnalyses ?? 0;
                          final isPremium = auth.user?.isPremium ?? false;
                          
                          return ElevatedButton.icon(
                            onPressed: (dreams.isAnalyzing || _textController.text.isEmpty)
                                ? null
                                : _analyzeDream,
                            icon: dreams.isAnalyzing
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Icon(Icons.auto_awesome),
                            label: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(dreams.isAnalyzing ? '感應中...' : '解讀天機'),
                                const SizedBox(width: 4),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    isPremium ? '∞' : '$remaining',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                ),
                              ],
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.deepPurple,
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Tags card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '夢境印記',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      ..._availableTags.map((tag) => TagChip(
                        label: tag,
                        selected: _selectedTags.contains(tag),
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
                      ..._selectedTags
                          .where((t) => !_availableTags.contains(t))
                          .map((tag) => TagChip(
                            label: tag,
                            selected: true,
                            onTap: () {
                              setState(() {
                                _selectedTags.remove(tag);
                              });
                            },
                          )),
                    ],
                  ),
                  const SizedBox(height: 12),
                  
                  // Custom tag input
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _customTagController,
                          decoration: const InputDecoration(
                            hintText: '＋ 鐫刻新印記',
                            isDense: true,
                          ),
                          onSubmitted: (value) {
                            if (value.trim().isNotEmpty) {
                              setState(() {
                                _selectedTags.add(value.trim());
                              });
                              _customTagController.clear();
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: () {
                          final value = _customTagController.text.trim();
                          if (value.isNotEmpty) {
                            setState(() {
                              _selectedTags.add(value);
                            });
                            _customTagController.clear();
                          }
                        },
                        child: const Text('鐫刻'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Stats card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Consumer<DreamProvider>(
                builder: (context, dreams, _) {
                  return Row(
                    children: [
                      _StatItem(
                        label: '總筆數',
                        value: dreams.totalDreams.toString(),
                      ),
                      _StatItem(
                        label: '夢境',
                        value: dreams.dreamCount.toString(),
                      ),
                      _StatItem(
                        label: '無夢',
                        value: dreams.noDreamCount.toString(),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Save buttons
          Row(
            children: [
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: () => _saveDream('dream'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: AppTheme.primary,
                  ),
                  child: const Text(
                    '封存夢境 🔮',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Consumer<DreamProvider>(
                  builder: (context, dreams, _) {
                    final today = DateTime.now();
                    final dateStr = '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
                    final hasNoDream = dreams.hasNoDreamForDate(dateStr);
                    
                    return OutlinedButton(
                      onPressed: hasNoDream ? null : () => _saveDream('no_dream'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        foregroundColor: hasNoDream ? Colors.green : AppTheme.muted,
                      ),
                      child: Text(
                        hasNoDream ? '虛無已記 ✓' : '一夜無夢 🌑',
                        style: const TextStyle(fontSize: 14),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;

  const _StatItem({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          color: AppTheme.surfaceSoft,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: AppTheme.muted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

