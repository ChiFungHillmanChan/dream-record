import 'package:flutter/material.dart';

class AppTheme {
  // Exact colors from web app globals.css
  static const Color bg1 = Color(0xFF0B0720);
  static const Color bg2 = Color(0xFF10143A);
  static const Color surface = Color(0xFF15183D);
  static const Color surfaceSoft = Color(0xFF111430);
  static const Color border = Color(0x38FFFFFF); // rgba(255, 255, 255, 0.22)
  static const Color txt = Color(0xFFF6F6FF);
  static const Color muted = Color(0xFFCFCFF7);
  static const Color accent = Color(0xFFA78BFA);
  static const Color accent2 = Color(0xFF22D3EE);
  static const Color danger = Color(0xFFF87171);
  static const Color ok = Color(0xFF34D399);
  
  // Helper colors for exact UI match
  static const Color slate400 = Color(0xFF94A3B8);

  // Tag palette from web app
  static const List<Color> tagPalette = [
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

  static Color getTagColor(String tag) {
    int h = 0;
    for (int i = 0; i < tag.length; i++) {
      h = ((h * 31) + tag.codeUnitAt(i)) & 0xFFFFFFFF;
    }
    return tagPalette[h.abs() % tagPalette.length];
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: Colors.transparent,
      colorScheme: const ColorScheme.dark(
        primary: accent,
        secondary: accent2,
        surface: surface,
        error: danger,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: txt,
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
        iconTheme: IconThemeData(color: muted),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF0F1230),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: accent2, width: 1),
        ),
        hintStyle: const TextStyle(color: muted, fontSize: 14),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accent,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: muted,
          side: const BorderSide(color: border),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: accent,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surface,
        selectedItemColor: accent,
        unselectedItemColor: muted,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      dividerTheme: const DividerThemeData(
        color: border,
        thickness: 1,
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(color: txt, fontWeight: FontWeight.bold),
        headlineMedium: TextStyle(color: txt, fontWeight: FontWeight.bold),
        titleLarge: TextStyle(color: txt, fontWeight: FontWeight.w600),
        titleMedium: TextStyle(color: txt),
        bodyLarge: TextStyle(color: txt),
        bodyMedium: TextStyle(color: Color(0xFFE5E7EB)),
        bodySmall: TextStyle(color: muted),
        labelSmall: TextStyle(color: muted, fontSize: 12),
      ),
    );
  }
}

// Gradient background matching web app
// CSS:
// background: radial-gradient(1200px 800px at 20% 10%, #1b1247 0%, transparent 60%),
//   radial-gradient(900px 600px at 80% 30%, #102d46 0%, transparent 70%),
//   linear-gradient(160deg, var(--bg1), var(--bg2));
class GradientBackground extends StatelessWidget {
  final Widget child;
  
  const GradientBackground({super.key, required this.child});
  
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          // 160deg is approximately top-left to bottom-right
          begin: Alignment(-0.4, -1.0),
          end: Alignment(0.4, 1.0),
          colors: [
            AppTheme.bg1,
            AppTheme.bg2,
          ],
        ),
      ),
      child: Stack(
        children: [
          // Radial 1: 20% 10% (Left-Top area)
          Positioned(
            top: -200,
            left: -200,
            child: Container(
              width: 800, // Scaled down slightly for mobile logic, web uses 1200px
              height: 600,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF1B1247),
                    Colors.transparent,
                  ],
                  stops: const [0.0, 0.6],
                ),
              ),
            ),
          ),
          // Radial 2: 80% 30% (Right-Top/Mid area)
          Positioned(
            top: 100,
            right: -200,
            child: Container(
              width: 600,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF102D46),
                    Colors.transparent,
                  ],
                  stops: const [0.0, 0.7],
                ),
              ),
            ),
          ),
          child,
        ],
      ),
    );
  }
}
