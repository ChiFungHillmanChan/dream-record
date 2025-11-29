# Dream Record - Project Structure

## Overview

Dream Record is a mystical dream journal application with a Next.js web frontend and a Flutter mobile app, sharing a common backend API.

## Directory Structure

```
dream-record/
├── src/                          # Next.js Web Application
│   ├── app/
│   │   ├── actions/              # Server actions
│   │   │   ├── admin.ts          # Admin management actions
│   │   │   ├── auth.ts           # Authentication actions
│   │   │   └── stripe.ts         # Payment actions
│   │   ├── actions.ts            # Main dream/analysis actions
│   │   ├── api/                  # REST API endpoints (for mobile)
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   └── me/route.ts
│   │   │   ├── dreams/
│   │   │   │   ├── route.ts      # GET/POST dreams
│   │   │   │   └── [id]/route.ts # GET/PUT/DELETE dream
│   │   │   ├── analysis/route.ts # POST analyze dream
│   │   │   ├── weekly-reports/route.ts
│   │   │   ├── transcribe/route.ts
│   │   │   └── stripe/
│   │   ├── services/             # External service integrations
│   │   │   ├── gemini.ts
│   │   │   ├── load-prompts.ts
│   │   │   ├── openai.ts
│   │   │   └── stripe.ts
│   │   └── [pages]/              # Page routes
│   ├── components/               # Shared React components
│   │   ├── DreamLoading.tsx
│   │   ├── DreamResult.tsx
│   │   └── UpgradePopup.tsx      # One-time upgrade celebration popup
│   ├── lib/                      # Shared utilities
│   │   ├── auth.ts               # Auth helpers (cookie + Bearer token)
│   │   ├── constants.ts          # App constants
│   │   ├── jwt.ts                # JWT utilities
│   │   ├── loading-context.tsx   # Loading state context for page transitions
│   │   ├── pdf-download.ts       # Robust PDF download with multiple fallbacks
│   │   └── prisma.ts             # Database client
│   └── middleware.ts             # Route protection
├── mobile/                       # Flutter Mobile Application
│   ├── lib/
│   │   ├── main.dart             # App entry point
│   │   ├── models/               # Data models
│   │   │   ├── user.dart
│   │   │   ├── dream.dart
│   │   │   └── weekly_report.dart
│   │   ├── providers/            # State management
│   │   │   ├── auth_provider.dart
│   │   │   └── dream_provider.dart
│   │   ├── screens/              # UI screens
│   │   │   ├── auth/
│   │   │   ├── home/
│   │   │   ├── dream/
│   │   │   ├── weekly_reports/
│   │   │   └── settings/
│   │   ├── services/
│   │   │   └── api_service.dart  # REST API client
│   │   ├── utils/
│   │   │   ├── constants.dart
│   │   │   ├── router.dart
│   │   │   └── theme.dart
│   │   └── widgets/
│   │       ├── tag_chip.dart
│   │       └── dream_card.dart
│   └── pubspec.yaml
├── prisma/                       # Database schema
│   ├── schema.dev.prisma
│   └── schema.prod.prisma
├── prompts/                      # AI prompt templates
│   ├── dream-analysis.txt
│   └── weekly-dream-analysis.txt
└── public/                       # Static assets
```

## Key Functions & Components

### Backend (Next.js)

#### Authentication (`src/lib/auth.ts`)
- `getSession()` - Get current session from cookie OR Bearer token header
- `setSession()` - Set session cookie
- `clearSession()` - Clear session cookie
- `hashPassword()` - Hash password with bcrypt
- `verifyPassword()` - Verify password

#### Dream Actions (`src/app/actions.ts`)
- `getDreams()` - Get all dreams for current user
- `saveDream()` - Create or update a dream
- `deleteDream()` - Delete a dream
- `analyzeDream()` - AI analysis of dream content
- `generateWeeklyReport()` - Generate weekly analysis report
- `getWeeklyReports()` - Get all weekly reports
- `getCurrentUser()` - Get current user info
- `getRemainingFreeAnalyses()` - Get remaining free analysis count
- `markUpgradePopupSeen()` - Mark upgrade celebration popup as seen
- `getUpgradePopupInfo()` - Get info for showing upgrade popup

#### REST API Endpoints (`src/app/api/`)
- `POST /api/auth/login` - Login and return JWT
- `POST /api/auth/register` - Register and return JWT
- `GET /api/auth/me` - Get current user info
- `GET /api/dreams` - List all dreams
- `POST /api/dreams` - Create dream
- `GET /api/dreams/:id` - Get single dream
- `PUT /api/dreams/:id` - Update dream
- `DELETE /api/dreams/:id` - Delete dream
- `POST /api/analysis` - Analyze dream
- `GET /api/weekly-reports` - List reports
- `POST /api/weekly-reports` - Generate report
- `POST /api/transcribe` - Transcribe audio

### Mobile (Flutter)

#### Services (`mobile/lib/services/api_service.dart`)
- `login()` - Authenticate user
- `register()` - Register new user
- `getCurrentUser()` - Get user info
- `getDreams()` - Fetch dreams list
- `createDream()` - Create new dream
- `updateDream()` - Update existing dream
- `deleteDream()` - Delete dream
- `analyzeDream()` - Request AI analysis
- `getWeeklyReports()` - Fetch reports
- `generateWeeklyReport()` - Request new report
- `transcribeAudio()` - Upload audio for transcription

#### Providers (`mobile/lib/providers/`)
- `AuthProvider` - Manages authentication state
- `DreamProvider` - Manages dreams list and CRUD operations

#### Screens (`mobile/lib/screens/`)
- `LoginScreen` - User login
- `RegisterScreen` - User registration
- `HomeScreen` - Main screen with tab navigation
- `RecordTab` - Dream recording interface
- `HistoryTab` - Calendar and dream history
- `DreamDetailScreen` - View dream details and analysis
- `WeeklyReportsScreen` - View and generate reports
- `SettingsScreen` - User settings and logout

## Database Models

### User
- id, email, password, name, username
- role (USER/SUPERADMIN)
- plan (FREE/DEEP), planExpiresAt
- upgradedByAdmin (Boolean) - true if admin gave trial upgrade
- hasSeenUpgradePopup (Boolean) - true if user has seen upgrade celebration
- lifetimeAnalysisCount, lifetimeWeeklyReportCount

### Dream
- id, userId, content, type (dream/no_dream)
- date, tags (JSON), analysis (JSON)
- createdAt, updatedAt

### WeeklyReport
- id, userId, startDate, endDate
- analysis (JSON), imageBase64
- createdAt


