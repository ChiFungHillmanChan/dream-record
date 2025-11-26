# Dream Record Mobile App

A Flutter mobile application for the Dream Record dream journal platform.

## Prerequisites

- Flutter SDK 3.0.0 or higher
- Dart SDK 3.0.0 or higher
- Android Studio / Xcode for platform-specific development

## Setup

1. **Install Flutter**
   Follow the official Flutter installation guide: https://docs.flutter.dev/get-started/install

2. **Install Dependencies**
   ```bash
   cd mobile
   flutter pub get
   ```

3. **Configure API URL**
   Edit `lib/utils/constants.dart` and update the `baseUrl`:
   
   - For Android emulator: `http://10.0.2.2:3000`
   - For iOS simulator: `http://localhost:3000`
   - For physical device: Use your computer's IP address
   - For production: Use your production API URL

4. **Run the App**
   ```bash
   # For development
   flutter run
   
   # For specific platform
   flutter run -d android
   flutter run -d ios
   ```

## Project Structure

```
mobile/
├── lib/
│   ├── main.dart              # App entry point
│   ├── models/                # Data models
│   │   ├── user.dart
│   │   ├── dream.dart
│   │   └── weekly_report.dart
│   ├── providers/             # State management
│   │   ├── auth_provider.dart
│   │   └── dream_provider.dart
│   ├── screens/               # UI screens
│   │   ├── auth/
│   │   ├── home/
│   │   ├── dream/
│   │   ├── weekly_reports/
│   │   └── settings/
│   ├── services/              # API services
│   │   └── api_service.dart
│   ├── utils/                 # Utilities
│   │   ├── constants.dart
│   │   ├── router.dart
│   │   └── theme.dart
│   └── widgets/               # Reusable widgets
│       ├── tag_chip.dart
│       └── dream_card.dart
├── pubspec.yaml               # Dependencies
└── README.md
```

## Features

- **Authentication**: Login/Register with email or username
- **Dream Recording**: Text input with voice-to-text support
- **Dream Tagging**: Customizable tags with preset suggestions
- **Calendar View**: Browse dreams by date
- **AI Analysis**: Get AI-powered dream interpretations
- **Weekly Reports**: Generate weekly dream analysis reports
- **Dark Theme**: Beautiful dark UI matching the web app

## API Endpoints

The app communicates with the Next.js backend via REST API:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `GET /api/dreams` - List dreams
- `POST /api/dreams` - Create dream
- `PUT /api/dreams/:id` - Update dream
- `DELETE /api/dreams/:id` - Delete dream
- `POST /api/analysis` - Analyze dream
- `GET /api/weekly-reports` - List reports
- `POST /api/weekly-reports` - Generate report
- `POST /api/transcribe` - Transcribe audio

## Building for Production

```bash
# Android APK
flutter build apk --release

# Android App Bundle
flutter build appbundle --release

# iOS
flutter build ios --release
```

## Notes

- The app requires the Next.js backend to be running
- Voice recording requires microphone permission
- Secure storage is used for JWT token persistence


