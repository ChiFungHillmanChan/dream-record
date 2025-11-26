import 'package:flutter/material.dart';
import '../utils/theme.dart';

class TagChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback? onTap;
  final VoidCallback? onRemove;

  const TagChip({
    super.key,
    required this.label,
    this.selected = false,
    this.onTap,
    this.onRemove,
  });

  Color _getTagColor() {
    const palette = [
      Color(0xFFA78BFA), // Purple
      Color(0xFF22D3EE), // Cyan
      Color(0xFFFB7185), // Pink
      Color(0xFF34D399), // Green
      Color(0xFFFBBF24), // Yellow
      Color(0xFFF472B6), // Light Pink
      Color(0xFF60A5FA), // Blue
      Color(0xFFF87171), // Red
      Color(0xFFC084FC), // Violet
      Color(0xFF2DD4BF), // Teal
    ];

    int hash = 0;
    for (int i = 0; i < label.length; i++) {
      hash = (hash * 31 + label.codeUnitAt(i)) & 0xFFFFFFFF;
    }
    return palette[hash.abs() % palette.length];
  }

  @override
  Widget build(BuildContext context) {
    final color = _getTagColor();
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? color.withOpacity(0.3) : color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: color,
            width: selected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                color: selected ? Colors.white : color,
                fontWeight: selected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            if (onRemove != null) ...[
              const SizedBox(width: 4),
              GestureDetector(
                onTap: onRemove,
                child: Icon(
                  Icons.close,
                  size: 16,
                  color: selected ? Colors.white : color,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}


