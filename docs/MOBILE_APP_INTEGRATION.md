# 📱 Mobile App (Capacitor / Android / iOS) Guide

## 1. Overview
The platform includes built-in Capacitor mobile configuration allowing instant compilation into high-performance Android APK/AAB and iOS packages for the Student Portal and Teacher Management App.

---

## 2. Configuration & Build Commands

### Available NPM Scripts:
```bash
# Build web assets and sync to native mobile folders
npm run mobile:build

# Sync changes to Android Capacitor project & open in Android Studio
npm run mobile:android

# Sync changes to iOS Capacitor project & open in Xcode
npm run mobile:ios

# Quick sync of web assets without rebuilding Next.js
npm run mobile:sync

# Generate white-label teacher management app configuration
npm run mobile:teacher
```

---

## 3. Mobile Capacitor Architecture
- **`capacitor.config.ts`**: Configures app package ID (`com.erraju.kumawat`), app name, server URL, and plugins.
- **Native Android Folder**: `android/` with Gradle 8+ wrapper and Android SDK target.
- **Native iOS Folder**: `ios/` with CocoaPods and Xcode project bundle.
- **Offline Storage & Caching**: Pre-cached exam assets, downloaded PDF notes, and offline token management.
