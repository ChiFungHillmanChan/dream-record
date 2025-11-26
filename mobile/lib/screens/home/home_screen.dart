import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dream_provider.dart';
import '../../utils/theme.dart';
import '../home/record_tab.dart';
import '../home/history_tab.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: Column(
            children: [
              // Header - matching web design
              _buildHeader(),
              
              // Streak grid for mobile
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _buildStreakGrid(),
              ),
              const SizedBox(height: 12),
              
              // Tab navigation
              _buildTabNav(),
              const SizedBox(height: 12),
              
              // Content
              Expanded(
                child: IndexedStack(
                  index: _currentIndex,
                  children: const [
                    RecordTab(),
                    HistoryTab(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Consumer2<AuthProvider, DreamProvider>(
      builder: (context, auth, dreams, _) {
        final todayStr = DateFormat('yyyy/M/d').format(DateTime.now());
        
        return Container(
          margin: const EdgeInsets.all(12),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.border),
          ),
          child: Row(
            children: [
              // App icon
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    colors: [AppTheme.accent, AppTheme.accent2],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.accent.withOpacity(0.5),
                      blurRadius: 12,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.nightlight_round,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              
              // Title and date
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      auth.user?.name ?? '夢境紀錄器',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: AppTheme.txt,
                      ),
                    ),
                    Text(
                      '$todayStr · 在遺忘之前，將潛意識封存。',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppTheme.muted,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Streak badge (desktop style, simplified for mobile)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceSoft,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.local_fire_department, size: 14, color: Colors.orange),
                    const SizedBox(width: 4),
                    Text(
                      '${dreams.getStreak()} 日',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.txt,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              
              // Weekly reports button
              _buildIconButton(
                icon: Icons.auto_awesome,
                onTap: () => context.go('/weekly-reports'),
              ),
              const SizedBox(width: 8),
              
              // Settings button
              _buildIconButton(
                icon: Icons.settings,
                onTap: () => context.go('/settings'),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildIconButton({required IconData icon, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppTheme.surfaceSoft,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Icon(icon, size: 20, color: AppTheme.muted),
      ),
    );
  }

  Widget _buildStreakGrid() {
    return Consumer<DreamProvider>(
      builder: (context, dreams, _) {
        final today = DateTime.now();
        final dreamDates = dreams.dreams.map((d) => d.date).toSet();
        
        return Row(
          children: List.generate(14, (i) {
            final date = today.subtract(Duration(days: 13 - i));
            final dateStr = DateFormat('yyyy-MM-dd').format(date);
            final dayDreams = dreams.dreams.where((d) => d.date == dateStr).toList();
            
            String status = 'none';
            if (dayDreams.any((d) => d.type == 'dream')) {
              status = 'dream';
            } else if (dayDreams.any((d) => d.type == 'no_dream')) {
              status = 'no_dream';
            }
            
            return Expanded(
              child: Container(
                height: 16,
                margin: const EdgeInsets.symmetric(horizontal: 1.5),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: Colors.white.withOpacity(0.2)),
                  gradient: status == 'dream'
                      ? LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            AppTheme.accent2.withOpacity(0.3),
                            AppTheme.accent.withOpacity(0.4),
                          ],
                        )
                      : status == 'no_dream'
                          ? LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.white.withOpacity(0.1),
                                Colors.white.withOpacity(0.05),
                              ],
                            )
                          : null,
                  color: status == 'none' ? Colors.white.withOpacity(0.05) : null,
                ),
              ),
            );
          }),
        );
      },
    );
  }

  Widget _buildTabNav() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: [
          Expanded(child: _buildTabButton(0, Icons.edit_note, '入夢')),
          const SizedBox(width: 8),
          Expanded(child: _buildTabButton(1, Icons.history, '夢迴')),
        ],
      ),
    );
  }

  Widget _buildTabButton(int index, IconData icon, String label) {
    final isActive = _currentIndex == index;
    
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isActive 
                ? AppTheme.accent.withOpacity(0.6)
                : AppTheme.border,
          ),
          gradient: isActive
              ? LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppTheme.accent.withOpacity(0.2),
                    AppTheme.accent2.withOpacity(0.1),
                  ],
                )
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: isActive ? AppTheme.txt : AppTheme.muted,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: isActive ? AppTheme.txt : AppTheme.muted,
                fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
