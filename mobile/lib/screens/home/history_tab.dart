import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../providers/dream_provider.dart';
import '../../utils/theme.dart';
import '../../widgets/dream_chip.dart';

class HistoryTab extends StatefulWidget {
  const HistoryTab({super.key});

  @override
  State<HistoryTab> createState() => _HistoryTabState();
}

class _HistoryTabState extends State<HistoryTab> {
  final _searchController = TextEditingController();
  String _filterType = 'all';
  String _calendarMode = 'month';
  DateTime _focusedDay = DateTime.now();
  DateTime _selectedDay = DateTime.now();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<DreamProvider>(
      builder: (context, provider, _) {
        // Filter dreams based on search and type
        final filteredDreams = provider.dreams.where((dream) {
          final matchesSearch = _searchController.text.isEmpty ||
              dream.content.toLowerCase().contains(_searchController.text.toLowerCase()) ||
              (dream.tags?.any((t) => t.toLowerCase().contains(_searchController.text.toLowerCase())) ?? false);
          
          final matchesType = _filterType == 'all' ||
              (_filterType == 'dream' && dream.type == 'dream') ||
              (_filterType == 'no_dream' && dream.type == 'no_dream');
          
          return matchesSearch && matchesType;
        }).toList();

        // Get dreams for selected date
        final selectedDateStr = DateFormat('yyyy-MM-dd').format(_selectedDay);
        final selectedDayDreams = filteredDreams.where((d) => d.date == selectedDateStr).toList();

        return SingleChildScrollView(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              // Search and filter bar
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  children: [
                    // Search input
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            style: const TextStyle(color: AppTheme.txt, fontSize: 14),
                            onChanged: (_) => setState(() {}),
                            decoration: InputDecoration(
                              hintText: '搜尋夢境...',
                              hintStyle: TextStyle(color: AppTheme.muted.withOpacity(0.7)),
                              prefixIcon: const Icon(Icons.search, color: AppTheme.muted, size: 20),
                              filled: true,
                              fillColor: const Color(0xFF0F1230),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
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
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    
                    // Filter buttons
                    Row(
                      children: [
                        _buildFilterButton('all', '全部', filteredDreams.length),
                        const SizedBox(width: 8),
                        _buildFilterButton('dream', '有夢', 
                            filteredDreams.where((d) => d.type == 'dream').length),
                        const SizedBox(width: 8),
                        _buildFilterButton('no_dream', '無夢', 
                            filteredDreams.where((d) => d.type == 'no_dream').length),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              
              // Calendar section
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  children: [
                    // Calendar mode toggle
                    Row(
                      children: [
                        _buildModeButton('month', '月'),
                        const SizedBox(width: 8),
                        _buildModeButton('week', '週'),
                        const SizedBox(width: 8),
                        _buildModeButton('day', '日'),
                        const Spacer(),
                        // Navigation arrows
                        IconButton(
                          onPressed: () {
                            setState(() {
                              if (_calendarMode == 'month') {
                                _focusedDay = DateTime(_focusedDay.year, _focusedDay.month - 1);
                              } else if (_calendarMode == 'week') {
                                _focusedDay = _focusedDay.subtract(const Duration(days: 7));
                              } else {
                                _selectedDay = _selectedDay.subtract(const Duration(days: 1));
                                _focusedDay = _selectedDay;
                              }
                            });
                          },
                          icon: const Icon(Icons.chevron_left, color: AppTheme.muted),
                          iconSize: 20,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                        ),
                        IconButton(
                          onPressed: () {
                            setState(() {
                              if (_calendarMode == 'month') {
                                _focusedDay = DateTime(_focusedDay.year, _focusedDay.month + 1);
                              } else if (_calendarMode == 'week') {
                                _focusedDay = _focusedDay.add(const Duration(days: 7));
                              } else {
                                _selectedDay = _selectedDay.add(const Duration(days: 1));
                                _focusedDay = _selectedDay;
                              }
                            });
                          },
                          icon: const Icon(Icons.chevron_right, color: AppTheme.muted),
                          iconSize: 20,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    
                    // Calendar
                    if (_calendarMode != 'day')
                      TableCalendar(
                        firstDay: DateTime.utc(2020, 1, 1),
                        lastDay: DateTime.utc(2030, 12, 31),
                        focusedDay: _focusedDay,
                        selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
                        calendarFormat: _calendarMode == 'week' 
                            ? CalendarFormat.week 
                            : CalendarFormat.month,
                        startingDayOfWeek: StartingDayOfWeek.sunday,
                        headerVisible: true,
                        headerStyle: HeaderStyle(
                          formatButtonVisible: false,
                          titleCentered: true,
                          titleTextStyle: const TextStyle(
                            color: AppTheme.txt,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                          leftChevronVisible: false,
                          rightChevronVisible: false,
                        ),
                        daysOfWeekStyle: const DaysOfWeekStyle(
                          weekdayStyle: TextStyle(color: AppTheme.muted, fontSize: 12),
                          weekendStyle: TextStyle(color: AppTheme.muted, fontSize: 12),
                        ),
                        calendarStyle: CalendarStyle(
                          defaultTextStyle: const TextStyle(color: AppTheme.txt),
                          weekendTextStyle: const TextStyle(color: AppTheme.txt),
                          outsideTextStyle: TextStyle(color: AppTheme.muted.withOpacity(0.5)),
                          selectedDecoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [AppTheme.accent, AppTheme.accent2],
                            ),
                            shape: BoxShape.circle,
                          ),
                          todayDecoration: BoxDecoration(
                            color: AppTheme.accent.withOpacity(0.3),
                            shape: BoxShape.circle,
                          ),
                          todayTextStyle: const TextStyle(color: AppTheme.txt),
                          markerDecoration: const BoxDecoration(
                            color: AppTheme.accent2,
                            shape: BoxShape.circle,
                          ),
                          markersMaxCount: 1,
                          markerSize: 6,
                          markerMargin: const EdgeInsets.only(top: 6),
                        ),
                        eventLoader: (day) {
                          final dateStr = DateFormat('yyyy-MM-dd').format(day);
                          return provider.dreams.where((d) => d.date == dateStr).toList();
                        },
                        onDaySelected: (selectedDay, focusedDay) {
                          setState(() {
                            _selectedDay = selectedDay;
                            _focusedDay = focusedDay;
                          });
                        },
                        onPageChanged: (focusedDay) {
                          setState(() {
                            _focusedDay = focusedDay;
                          });
                        },
                      )
                    else
                      // Day view - show selected date prominently
                      Container(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            Text(
                              DateFormat('yyyy年M月d日').format(_selectedDay),
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.txt,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              DateFormat('EEEE', 'zh_TW').format(_selectedDay),
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppTheme.muted,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              
              // Dreams for selected date
              if (selectedDayDreams.isEmpty)
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        '🌙',
                        style: TextStyle(fontSize: 40),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        '${DateFormat('M月d日').format(_selectedDay)} 尚無夢境記錄',
                        style: const TextStyle(
                          color: AppTheme.muted,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                )
              else
                ...selectedDayDreams.map((dream) => _buildDreamCard(dream)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFilterButton(String type, String label, int count) {
    final isActive = _filterType == type;
    
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _filterType = type),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isActive ? AppTheme.accent.withOpacity(0.2) : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isActive ? AppTheme.accent : AppTheme.border,
            ),
          ),
          child: Column(
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: isActive ? AppTheme.txt : AppTheme.muted,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                ),
              ),
              Text(
                '$count',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isActive ? AppTheme.accent : AppTheme.muted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModeButton(String mode, String label) {
    final isActive = _calendarMode == mode;
    
    return GestureDetector(
      onTap: () => setState(() => _calendarMode = mode),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.accent.withOpacity(0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isActive ? AppTheme.accent : AppTheme.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isActive ? AppTheme.txt : AppTheme.muted,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildDreamCard(dynamic dream) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => context.go('/dream/${dream.id}'),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header with type badge and time
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: dream.type == 'dream' 
                            ? AppTheme.accent.withOpacity(0.2)
                            : Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        dream.type == 'dream' ? '🌙 夢境' : '😴 無夢',
                        style: TextStyle(
                          fontSize: 11,
                          color: dream.type == 'dream' ? AppTheme.accent : AppTheme.muted,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      DateFormat('HH:mm').format(dream.createdAt),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.muted,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                
                // Content preview
                Text(
                  dream.content.length > 100 
                      ? '${dream.content.substring(0, 100)}...'
                      : dream.content,
                  style: const TextStyle(
                    color: AppTheme.txt,
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
                
                // Tags
                if (dream.tags != null && dream.tags!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: (dream.tags as List<String>).map((tag) => DreamChip(
                      label: tag,
                      isActive: true,
                      small: true,
                    )).toList(),
                  ),
                ],
                
                // Analysis indicator
                if (dream.analysis != null) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(
                        Icons.auto_awesome,
                        size: 14,
                        color: AppTheme.accent.withOpacity(0.7),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '已解讀',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppTheme.accent.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
