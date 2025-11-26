import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:intl/intl.dart';
import '../../providers/dream_provider.dart';
import '../../models/dream.dart';
import '../../utils/theme.dart';
import '../../widgets/dream_card.dart';

class HistoryTab extends StatefulWidget {
  const HistoryTab({super.key});

  @override
  State<HistoryTab> createState() => _HistoryTabState();
}

class _HistoryTabState extends State<HistoryTab> {
  CalendarFormat _calendarFormat = CalendarFormat.month;
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _selectedDay = DateTime.now();
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<DreamProvider>(
      builder: (context, dreams, _) {
        // Create a map of dates to dreams for calendar markers
        final dreamsByDate = <String, List<Dream>>{};
        for (final dream in dreams.dreams) {
          dreamsByDate.putIfAbsent(dream.date, () => []).add(dream);
        }

        // Get dreams for selected date
        final selectedDateStr = _selectedDay != null ? _formatDate(_selectedDay!) : null;
        final selectedDreams = selectedDateStr != null 
            ? (dreamsByDate[selectedDateStr] ?? [])
            : <Dream>[];

        // Filter by search if needed
        final filteredDreams = _searchQuery.isEmpty
            ? selectedDreams
            : selectedDreams.where((d) => 
                d.content.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                d.tags.any((t) => t.toLowerCase().contains(_searchQuery.toLowerCase()))
              ).toList();

        return Column(
          children: [
            // Search bar
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                onChanged: (value) => setState(() => _searchQuery = value),
                decoration: InputDecoration(
                  hintText: '搜尋...',
                  prefixIcon: const Icon(Icons.search),
                  isDense: true,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),

            // Calendar
            Card(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              child: TableCalendar(
                firstDay: DateTime.utc(2020, 1, 1),
                lastDay: DateTime.utc(2030, 12, 31),
                focusedDay: _focusedDay,
                calendarFormat: _calendarFormat,
                selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
                onDaySelected: (selectedDay, focusedDay) {
                  setState(() {
                    _selectedDay = selectedDay;
                    _focusedDay = focusedDay;
                  });
                },
                onFormatChanged: (format) {
                  setState(() {
                    _calendarFormat = format;
                  });
                },
                onPageChanged: (focusedDay) {
                  _focusedDay = focusedDay;
                },
                calendarStyle: CalendarStyle(
                  todayDecoration: BoxDecoration(
                    color: AppTheme.accent.withOpacity(0.3),
                    shape: BoxShape.circle,
                  ),
                  selectedDecoration: const BoxDecoration(
                    color: AppTheme.primary,
                    shape: BoxShape.circle,
                  ),
                  markerDecoration: const BoxDecoration(
                    color: AppTheme.accent,
                    shape: BoxShape.circle,
                  ),
                  outsideDaysVisible: false,
                ),
                headerStyle: const HeaderStyle(
                  formatButtonVisible: true,
                  titleCentered: true,
                  formatButtonShowsNext: false,
                  formatButtonDecoration: BoxDecoration(
                    border: Border.fromBorderSide(BorderSide(color: AppTheme.border)),
                    borderRadius: BorderRadius.all(Radius.circular(8)),
                  ),
                ),
                calendarBuilders: CalendarBuilders(
                  markerBuilder: (context, date, events) {
                    final dateStr = _formatDate(date);
                    final dayDreams = dreamsByDate[dateStr] ?? [];
                    if (dayDreams.isEmpty) return null;

                    final hasDream = dayDreams.any((d) => d.type == 'dream');
                    final hasNoDream = dayDreams.any((d) => d.type == 'no_dream');

                    return Positioned(
                      bottom: 1,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (hasDream)
                            Container(
                              width: 6,
                              height: 6,
                              margin: const EdgeInsets.symmetric(horizontal: 1),
                              decoration: const BoxDecoration(
                                color: AppTheme.primary,
                                shape: BoxShape.circle,
                              ),
                            ),
                          if (hasNoDream && !hasDream)
                            Container(
                              width: 6,
                              height: 6,
                              margin: const EdgeInsets.symmetric(horizontal: 1),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.3),
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Selected date header
            if (_selectedDay != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      DateFormat('yyyy年M月d日').format(_selectedDay!),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      '${filteredDreams.length} 筆紀錄',
                      style: const TextStyle(
                        color: AppTheme.muted,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 8),

            // Dream list
            Expanded(
              child: filteredDreams.isEmpty
                  ? const Center(
                      child: Text(
                        '尚無夢境隨筆',
                        style: TextStyle(color: AppTheme.muted),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: filteredDreams.length,
                      itemBuilder: (context, index) {
                        final dream = filteredDreams[index];
                        return DreamCard(
                          dream: dream,
                          onTap: () => context.go('/dream/${dream.id}'),
                          onDelete: () async {
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
                            if (confirmed == true) {
                              dreams.deleteDream(dream.id);
                            }
                          },
                        );
                      },
                    ),
            ),
          ],
        );
      },
    );
  }
}

