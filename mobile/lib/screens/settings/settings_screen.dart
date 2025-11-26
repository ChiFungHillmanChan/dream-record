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
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/'),
        ),
        title: const Text('設定'),
      ),
      body: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          final user = auth.user;
          
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // User info card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                colors: [AppTheme.primary, AppTheme.accent],
                              ),
                            ),
                            child: Center(
                              child: Text(
                                user?.name?.substring(0, 1).toUpperCase() ?? '?',
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  user?.name ?? '未知用戶',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  user?.email ?? '',
                                  style: const TextStyle(
                                    color: AppTheme.muted,
                                  ),
                                ),
                                if (user?.username != null) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    '@${user!.username}',
                                    style: const TextStyle(
                                      color: AppTheme.muted,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Divider(color: AppTheme.border),
                      const SizedBox(height: 16),
                      
                      // Plan info
                      Row(
                        children: [
                          const Icon(Icons.star_outline, color: AppTheme.muted, size: 20),
                          const SizedBox(width: 8),
                          const Text('方案：'),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: user?.isPremium == true
                                  ? Colors.amber.withOpacity(0.2)
                                  : AppTheme.surfaceSoft,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: user?.isPremium == true
                                    ? Colors.amber
                                    : AppTheme.border,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (user?.isPremium == true)
                                  const Icon(Icons.workspace_premium, size: 16, color: Colors.amber),
                                if (user?.isPremium == true)
                                  const SizedBox(width: 4),
                                Text(
                                  user?.isPremium == true ? '深度版' : '免費版',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: user?.isPremium == true
                                        ? Colors.amber
                                        : AppTheme.muted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      
                      // Remaining analyses
                      Row(
                        children: [
                          const Icon(Icons.auto_awesome, color: AppTheme.muted, size: 20),
                          const SizedBox(width: 8),
                          const Text('剩餘解析次數：'),
                          const Spacer(),
                          Text(
                            user?.isPremium == true 
                                ? '無限' 
                                : '${user?.remainingAnalyses ?? 0}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Settings options
              const Text(
                '設定',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.muted,
                ),
              ),
              const SizedBox(height: 8),
              
              Card(
                child: Column(
                  children: [
                    _SettingsTile(
                      icon: Icons.language,
                      title: '語言',
                      trailing: const Text('繁體中文'),
                      onTap: () {
                        // Language selection
                      },
                    ),
                    const Divider(height: 1, color: AppTheme.border),
                    _SettingsTile(
                      icon: Icons.notifications_outlined,
                      title: '通知',
                      trailing: const Icon(Icons.chevron_right, color: AppTheme.muted),
                      onTap: () {
                        // Notification settings
                      },
                    ),
                    const Divider(height: 1, color: AppTheme.border),
                    _SettingsTile(
                      icon: Icons.info_outline,
                      title: '關於',
                      trailing: const Text('v1.0.0'),
                      onTap: () {
                        showAboutDialog(
                          context: context,
                          applicationName: '夢境紀錄',
                          applicationVersion: '1.0.0',
                          applicationLegalese: '© 2024 Dream Record',
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Logout button
              ElevatedButton.icon(
                onPressed: () async {
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      backgroundColor: AppTheme.surface,
                      title: const Text('確認登出'),
                      content: const Text('確定要登出嗎？'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: const Text('取消'),
                        ),
                        ElevatedButton(
                          onPressed: () => Navigator.pop(context, true),
                          child: const Text('登出'),
                        ),
                      ],
                    ),
                  );
                  
                  if (confirmed == true && context.mounted) {
                    await auth.logout();
                    if (context.mounted) {
                      context.go('/login');
                    }
                  }
                },
                icon: const Icon(Icons.logout),
                label: const Text('登出'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.surface,
                  foregroundColor: AppTheme.danger,
                  side: const BorderSide(color: AppTheme.danger),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
              const SizedBox(height: 32),
            ],
          );
        },
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget? trailing;
  final VoidCallback? onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.muted),
      title: Text(title),
      trailing: trailing,
      onTap: onTap,
    );
  }
}


