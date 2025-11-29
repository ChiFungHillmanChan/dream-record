# 📱 Complete Guide to Publishing Your Flutter App

## Overview

Publishing involves these major steps:
1. **Prerequisites** - Set up developer accounts and tools
2. **Backend Deployment** - Deploy your Next.js server
3. **App Configuration** - Update app identifiers and API URL
4. **iOS App Store** - Build, sign, and submit to Apple
5. **Google Play Store** - Build, sign, and submit to Google

---

## 1. Prerequisites

### Developer Accounts (One-time setup)

| Platform | Cost | URL |
|----------|------|-----|
| **Apple Developer Program** | $99/year | https://developer.apple.com/programs/ |
| **Google Play Console** | $25 one-time | https://play.google.com/console/ |

### Required Tools on Your Mac

```bash
# Install CocoaPods (for iOS)
sudo gem install cocoapods

# Install Android Studio (for Android SDK)
# Download from: https://developer.android.com/studio

# After Android Studio installation, run:
flutter doctor --android-licenses
```

---

## 2. Deploy Your Backend First

Your mobile app needs a server to connect to. Deploy the Next.js backend:

### Option A: Vercel (Recommended - Free tier available)
1. Go to https://vercel.com
2. Import your GitHub repo
3. Set environment variables:
   - `DATABASE_URL` (use a cloud database like Supabase, PlanetScale, or Neon)
   - `JWT_SECRET`
   - `OPENAI_API_KEY`
   - Other secrets from your `.env`
4. Deploy → Get URL like `https://dream-record.vercel.app`

### Option B: Railway
1. Go to https://railway.app
2. Create new project from GitHub
3. Add PostgreSQL database
4. Set environment variables
5. Deploy → Get URL

### After Deployment
Update `mobile/lib/services/api_service.dart`:

```dart
// Change this:
static const String baseUrl = 'http://localhost:3000/api';

// To your production URL:
static const String baseUrl = 'https://your-dream-app.vercel.app/api';
```

---

## 3. App Configuration

### Update App Identifiers

#### iOS (`mobile/ios/Runner.xcodeproj/project.pbxproj`)
Change `PRODUCT_BUNDLE_IDENTIFIER` from `com.example.dreamRecordMobile` to your own:
```
PRODUCT_BUNDLE_IDENTIFIER = com.yourcompany.dreamrecord;
```

#### Android (`mobile/android/app/build.gradle.kts`)
Change `applicationId`:
```kotlin
applicationId = "com.yourcompany.dreamrecord"
```

### Create App Icons
Replace the default Flutter icons with your custom app icon:
- Use a tool like https://appicon.co/
- Upload your 1024x1024 icon
- Download and replace files in:
  - `mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/`
  - `mobile/android/app/src/main/res/mipmap-*/`

---

## 4. iOS App Store Submission

### Step 4.1: Install CocoaPods Dependencies
```bash
cd mobile/ios
pod install
cd ..
```

### Step 4.2: Open in Xcode
```bash
open ios/Runner.xcworkspace
```

### Step 4.3: Configure Signing in Xcode
1. Select **Runner** in the project navigator
2. Go to **Signing & Capabilities** tab
3. Select your **Team** (your Apple Developer account)
4. Xcode will automatically create provisioning profiles

### Step 4.4: Update App Information
In Xcode, update `Info.plist`:
- `CFBundleDisplayName`: "夢境紀錄器" (or your app name)
- `CFBundleShortVersionString`: "1.0.0"
- `CFBundleVersion`: "1"

### Step 4.5: Build for Release
```bash
cd mobile
flutter build ios --release
```

### Step 4.6: Archive and Upload
1. In Xcode: **Product → Archive**
2. When complete, **Organizer** window opens
3. Click **Distribute App**
4. Select **App Store Connect**
5. Follow prompts to upload

### Step 4.7: App Store Connect Setup
1. Go to https://appstoreconnect.apple.com
2. Create a **New App**:
   - Platform: iOS
   - Name: 夢境紀錄器 (Dream Record)
   - Primary Language: Traditional Chinese (or English)
   - Bundle ID: Select the one you created
   - SKU: dreamrecord001
3. Fill in required information:
   - **App Information**: Description, keywords, support URL
   - **Pricing**: Free or paid
   - **App Privacy**: Data collection details
   - **Screenshots**: Required sizes (6.7", 6.5", 5.5" iPhones, iPads)
4. Select the build you uploaded
5. **Submit for Review**

### iOS Review Timeline
- First review: 24-48 hours typically
- May take longer if issues found

---

## 5. Google Play Store Submission

### Step 5.1: Create Keystore (One-time)
```bash
cd mobile/android
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload

# Save the keystore password securely!
```

### Step 5.2: Configure Signing
Create `mobile/android/key.properties`:
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=upload
storeFile=../upload-keystore.jks
```

Update `mobile/android/app/build.gradle.kts`:
```kotlin
// Add at the top
import java.util.Properties
import java.io.FileInputStream

val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...
    
    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["storePassword"] as String
        }
    }
    
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            // ... other config ...
        }
    }
}
```

### Step 5.3: Build App Bundle
```bash
cd mobile
flutter build appbundle --release
```
Output: `build/app/outputs/bundle/release/app-release.aab`

### Step 5.4: Google Play Console Setup
1. Go to https://play.google.com/console
2. **Create app**:
   - App name: 夢境紀錄器
   - Default language: Chinese (Traditional)
   - App or game: App
   - Free or paid: Free
3. Complete **Dashboard** tasks:
   - **App access**: All functionality available
   - **Ads**: Does not contain ads
   - **Content rating**: Complete questionnaire
   - **Target audience**: 18+ (dreams may have mature content)
   - **News app**: No
   - **COVID-19**: No
   - **Data safety**: Declare what data you collect
   - **Government apps**: No

### Step 5.5: Store Listing
Fill in:
- **Short description**: 記錄你的夢境，AI幫你解讀
- **Full description**: Detailed app description
- **Screenshots**: Phone and tablet screenshots
- **Feature graphic**: 1024x500 banner image
- **App icon**: 512x512 PNG

### Step 5.6: Upload and Release
1. Go to **Production** → **Create new release**
2. Upload the `.aab` file
3. Add release notes
4. **Review release** → **Start rollout to Production**

### Play Store Review Timeline
- Usually 1-3 days for new apps
- Updates are faster (hours to 1 day)

---

## 6. Post-Launch Checklist

- [ ] Monitor crash reports (Firebase Crashlytics recommended)
- [ ] Respond to user reviews
- [ ] Plan update cycle (bug fixes, new features)
- [ ] Set up analytics (Firebase Analytics)
- [ ] Enable push notifications (Firebase Cloud Messaging)

---

## Quick Reference Commands

```bash
# iOS
cd mobile
flutter build ios --release
open ios/Runner.xcworkspace  # Then Archive in Xcode

# Android
cd mobile
flutter build appbundle --release
# Upload build/app/outputs/bundle/release/app-release.aab to Play Console
```

---

## Important Notes

1. **Keep your keystore safe!** If you lose `upload-keystore.jks`, you cannot update your Android app.
2. **Screenshots are mandatory** - Prepare them before submission.
3. **Privacy Policy required** - Both stores require a privacy policy URL.
4. **Test thoroughly** before submitting - rejections delay your launch.
5. **Backend must be live** before app review - reviewers will test the app.

---

## Database Location FAQ

### Where does the database go when deployed to app stores?

**Short Answer:** The database stays on your backend server (e.g., Vercel, Railway), NOT on the user's device.

**Detailed Explanation:**

1. **Your Architecture:**
   ```
   [User's iPhone/Android] → API Calls → [Next.js Backend on Vercel] → [Cloud Database]
   ```

2. **Mobile App:**
   - Contains NO database
   - Only stores JWT token locally (for authentication)
   - Makes HTTP requests to your backend API

3. **Backend Server (Next.js):**
   - Runs on a cloud provider (Vercel, Railway, etc.)
   - Contains your Prisma ORM and business logic
   - Connects to a cloud database

4. **Database Options:**
   - **Vercel Postgres** (integrated with Vercel)
   - **Supabase** (PostgreSQL, free tier available)
   - **PlanetScale** (MySQL, free tier available)
   - **Neon** (PostgreSQL, free tier available)
   - **Azure SQL Database** (since you're using MS SQL Server for prod)

5. **Migration from SQLite to Cloud Database:**
   - Your current `schema.prod.prisma` uses MS SQL Server - perfect for production
   - Deploy database to Azure SQL Database or another MS SQL provider
   - Update `DATABASE_URL` environment variable on Vercel to point to cloud database
   - Run migrations: `pnpm db:prod:migrate`

6. **What's on the User's Device:**
   - Flutter app code (Dart compiled to native)
   - App assets (images, fonts)
   - JWT token (in secure storage)
   - NO database, NO user data from other users

7. **Data Flow Example:**
   ```
   User records dream on iPhone
     ↓ (HTTP POST request with JWT)
   Next.js API receives request
     ↓ (Validates JWT, uses Prisma)
   Database saves dream (on cloud server)
     ↓ (Returns success)
   iPhone displays confirmation
   ```

This architecture ensures:
- ✅ Data is centralized and backed up
- ✅ Users can access their dreams from any device
- ✅ App size stays small (no embedded database)
- ✅ You can update backend logic without app updates
- ✅ Proper security (database not exposed to users)






