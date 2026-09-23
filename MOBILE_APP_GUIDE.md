# 📱 Mobile App Guide - Play Store & App Store

## Overview

This project uses **Capacitor** to package the web app as native mobile apps for:
- ✅ **Android** (Google Play Store)
- ✅ **iOS** (Apple App Store)
- ✅ **PWA** (installable from browser)

Each teacher gets their own custom-branded app with unique:
- App ID (com.errkt.{orgCode})
- App Name (teacher's brand)
- App Icon (teacher's logo)
- Server URL (teacher's portal)

---

## 🛠️ Setup (One-time)

### Prerequisites
- **Android Studio** (for Android builds)
- **Xcode** (for iOS builds, macOS only)
- **Node.js 18+** and **Bun**

### Install Dependencies
```bash
bun install
```

### Initialize Capacitor (already done)
```bash
bunx cap add android
bunx cap add ios
```

---

## 📦 Build Mobile App

### Option 1: Build for All Platforms
```bash
bun run mobile:build
```

### Option 2: Build + Open Android Studio
```bash
bun run mobile:android
```

### Option 3: Build + Open Xcode
```bash
bun run mobile:ios
```

### Option 4: Generate Per-Teacher App
```bash
# Generate app for specific teacher
bun run mobile:teacher ERKTACADEMY
bun run mobile:teacher DPS2024
bun run mobile:teacher VISN2024
```

This will:
1. Fetch teacher's branding from database
2. Update `capacitor.config.ts` with teacher's appId, appName, server URL
3. Build the web app
4. Sync to native platforms
5. Output instructions for final build

---

## 🤖 Android (Play Store) Upload

### Step 1: Generate Signed APK/AAB
```bash
bun run mobile:android
# Android Studio opens
```

In Android Studio:
1. **Build > Generate Signed Bundle / APK**
2. Select **Android App Bundle (AAB)** (required for Play Store)
3. Create or select keystore:
   - Click "Create new" if first time
   - Save keystore file securely (DON'T LOSE THIS!)
   - Set keystore password, key alias, key password
4. Select **release** build variant
5. Click **Finish**

### Step 2: Upload to Play Store
1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app (or select existing)
3. **Release > Production > Create release**
4. Upload the `.aab` file from:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```
5. Fill in release notes
6. Click **Review release** → **Start rollout**

### Play Store Requirements:
- ✅ App Bundle (.aab) format
- ✅ Signed with keystore
- ✅ Min SDK 21 (Android 5.0+)
- ✅ Target SDK 34 (Android 14)
- ✅ App icon (512x512 PNG)
- ✅ Feature graphic (1024x500 PNG)
- ✅ Privacy Policy URL
- ✅ App description

---

## 🍎 iOS (App Store) Upload

### Step 1: Configure Signing
```bash
bun run mobile:ios
# Xcode opens
```

In Xcode:
1. Select app target
2. **Signing & Capabilities** tab
3. Select your **Team** (Apple Developer account)
4. Set **Bundle Identifier** (e.g., `com.errkt.erktacademy`)
5. Xcode auto-manages signing

### Step 2: Archive and Upload
1. **Product > Archive**
2. Wait for archive to build
3. **Distribute App > App Store Connect**
4. Follow wizard:
   - Upload (not Export)
   - Include bitcode: No
   - Upload symbols: Yes
5. Click **Upload**

### Step 3: Submit for Review
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. **App Store > Submit for Review**
4. Fill in:
   - App description
   - Screenshots (required for all device sizes)
   - App category (Education)
   - Privacy Policy URL
   - Age rating
5. Click **Submit for Review**

### App Store Requirements:
- ✅ Apple Developer Account ($99/year)
- ✅ App signed with distribution certificate
- ✅ Screenshots for all device sizes
- ✅ App Privacy details
- ✅ Privacy Policy URL
- ✅ App Review Information

---

## 🎨 Per-Teacher Customization

Each teacher's app is fully customizable:

### Custom App Icon
```bash
# Generate icons from teacher's logo
bunx tsx scripts/generate-teacher-app.ts ERKTACADEMY
```

### Custom Branding
The app automatically pulls branding from the database:
- App Name → `WhiteLabelConfig.orgName`
- App Icon → `WhiteLabelConfig.logo`
- Splash Screen → `WhiteLabelConfig.primaryColor`
- Server URL → `https://{orgCode}.errkt.com`

### Custom App ID
Each teacher gets a unique App ID:
- ERKTACADEMY → `com.errkt.erktacademy`
- DPS2024 → `com.errkt.dps2024`
- VISN2024 → `com.errkt.visn2024`

This allows multiple apps on the same device!

---

## 🔄 Update Process

When you update the web app:

### For PWA (automatic)
- Users get updates instantly on next visit
- Service Worker handles caching

### For Native Apps (manual)
```bash
# 1. Build updated web app
bun run mobile:build

# 2. Sync to native
bunx cap sync

# 3. Build new APK/AAB
bun run mobile:android  # or mobile:ios

# 4. Upload to stores
```

### Store Review Times
- **Play Store**: 1-3 days
- **App Store**: 1-7 days

---

## 📊 Testing

### Test on Device
```bash
# Android (connect device via USB)
bun run mobile:android
# Run on device in Android Studio

# iOS (connect device via USB)
bun run mobile:ios
# Run on device in Xcode
```

### Test on Emulator
```bash
# Android
bun run mobile:android
# Create AVD in Android Studio > Run

# iOS
bun run mobile:ios
# Select simulator > Run
```

---

## 🔑 Important Notes

### Keystore Security
- **NEVER lose your keystore file!**
- If you lose it, you CANNOT update your app on Play Store
- Back it up to multiple secure locations
- Each teacher should have their own keystore

### App Store Accounts
- **Google Play**: $25 one-time fee
- **Apple Developer**: $99/year
- Each teacher can use your account or their own

### Multiple Apps
- Each teacher = separate app on stores
- Each has unique App ID
- Each can be installed side-by-side
- Each has custom branding

---

## 📱 PWA Alternative (No Store Review)

If you want instant updates without store review:
1. Deploy web app to your domain
2. Users visit the URL on mobile
3. Browser prompts "Add to Home Screen"
4. App installs like native app

**PWA Benefits:**
- ✅ No store review
- ✅ Instant updates
- ✅ Works on all devices
- ✅ Offline support
- ✅ Push notifications (Android + iOS 16.4+)

**PWA Limitations:**
- ❌ Not in Play Store/App Store
- ❌ Some iOS limitations (background tasks)
- ❌ Users must manually install

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Clean and rebuild
rm -rf .next out android/app/src/main/assets/public
bun run mobile:build
```

### Capacitor Sync Fails
```bash
# Reinstall platforms
rm -rf android ios
bunx cap add android
bunx cap add ios
bunx cap sync
```

### App Shows Blank Screen
- Check `server.url` in capacitor.config.ts
- Ensure server is running and accessible
- Check `allowMixedContent: true` for HTTP

### Push Notifications Not Working
- Android: Add Firebase Cloud Messaging
- iOS: Configure APNs in Xcode
- Update service worker for web push
