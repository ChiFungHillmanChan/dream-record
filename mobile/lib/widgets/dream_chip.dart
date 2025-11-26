import 'package:flutter/material.dart';
import '../utils/theme.dart';

class DreamChip extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback? onTap;
  final VoidCallback? onRemove;
  final bool small;

  const DreamChip({
    super.key,
    required this.label,
    this.isActive = false,
    this.onTap,
    this.onRemove,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.getTagColor(label);
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: small ? 8 : 12,
          vertical: small ? 4 : 8,
        ),
        decoration: BoxDecoration(
          color: isActive ? color.withOpacity(0.3) : color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: color.withOpacity(0.2),
                    blurRadius: 4,
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                color: const Color(0xFFEEEEFF),
                fontSize: small ? 11 : 13,
              ),
            ),
            if (onRemove != null) ...[
              const SizedBox(width: 4),
              GestureDetector(
                onTap: onRemove,
                child: const Icon(
                  Icons.close,
                  size: 14,
                  color: Color(0xFFEEEEFF),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

