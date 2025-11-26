import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../utils/theme.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

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
                    const Text(
                      '設定',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.txt,
                      ),
                    ),
                  ],
                ),
              ),
              
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    children: [
                      // User info card
                      Consumer<AuthProvider>(
                        builder: (context, auth, _) {
                          final user = auth.user;
                          return Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: AppTheme.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppTheme.border),
                            ),
                            child: Column(
                              children: [
                                // Avatar
                                Container(
                                  width: 80,
                                  height: 80,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    gradient: const LinearGradient(
                                      colors: [AppTheme.accent, AppTheme.accent2],
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: AppTheme.accent.withOpacity(0.4),
                                        blurRadius: 20,
                                      ),
                                    ],
                                  ),
                                  child: Center(
                                    child: Text(
                                      user?.name.isNotEmpty == true 
                                          ? user!.name[0].toUpperCase()
                                          : '?',
                                      style: const TextStyle(
                                        fontSize: 32,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                
                                Text(
                                  user?.name ?? '未知用戶',
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.txt,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  user?.email ?? '',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    color: AppTheme.muted,
                                  ),
                                ),
                                
                                // Plan badge
                                if (user?.plan == 'DEEP') ...[
                                  const SizedBox(height: 12),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.purple.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                        color: Colors.purple.withOpacity(0.3),
                                      ),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          Icons.workspace_premium,
                                          size: 16,
                                          color: Colors.amber,
                                        ),
                                        SizedBox(width: 6),
                                        Text(
                                          '深度版',
                                          style: TextStyle(
                                            fontSize: 13,
                                            color: Colors.purple,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 16),
                      
                      // Settings options
                      Container(
                        decoration: BoxDecoration(
                          color: AppTheme.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Column(
                          children: [
                            _buildSettingItem(
                              icon: Icons.person_outline,
                              title: '個人資料',
                              onTap: () {
                                // TODO: Navigate to profile edit
                              },
                            ),
                            const Divider(color: AppTheme.border, height: 1),
                            _buildSettingItem(
                              icon: Icons.notifications_outlined,
                              title: '通知設定',
                              onTap: () {
                                // TODO: Navigate to notification settings
                              },
                            ),
                            const Divider(color: AppTheme.border, height: 1),
                            _buildSettingItem(
                              icon: Icons.lock_outline,
                              title: '隱私設定',
                              onTap: () {
                                // TODO: Navigate to privacy settings
                              },
                            ),
                            const Divider(color: AppTheme.border, height: 1),
                            _buildSettingItem(
                              icon: Icons.help_outline,
                              title: '幫助與支援',
                              onTap: () {
                                // TODO: Navigate to help
                              },
                            ),
                            const Divider(color: AppTheme.border, height: 1),
                            _buildSettingItem(
                              icon: Icons.info_outline,
                              title: '關於',
                              onTap: () {
                                showAboutDialog(
                                  context: context,
                                  applicationName: '夢境紀錄器',
                                  applicationVersion: '1.0.0',
                                  applicationLegalese: '© 2024 Dream Record',
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Logout button
                      Container(
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: AppTheme.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () async {
                              final confirmed = await showDialog<bool>(
                                context: context,
                                builder: (context) => AlertDialog(
                                  backgroundColor: AppTheme.surface,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  title: const Text(
                                    '確認登出',
                                    style: TextStyle(color: AppTheme.txt),
                                  ),
                                  content: const Text(
                                    '你確定要登出嗎？',
                                    style: TextStyle(color: AppTheme.muted),
                                  ),
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
                                      child: const Text('登出'),
                                    ),
                                  ],
                                ),
                              );
                              
                              if (confirmed == true && context.mounted) {
                                await context.read<AuthProvider>().logout();
                                if (context.mounted) {
                                  context.go('/login');
                                }
                              }
                            },
                            child: const Padding(
                              padding: EdgeInsets.all(16),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.logout,
                                    color: AppTheme.danger,
                                    size: 20,
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    '登出',
                                    style: TextStyle(
                                      color: AppTheme.danger,
                                      fontSize: 16,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSettingItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(icon, color: AppTheme.muted, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: AppTheme.txt,
                    fontSize: 15,
                  ),
                ),
              ),
              const Icon(
                Icons.chevron_right,
                color: AppTheme.muted,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
