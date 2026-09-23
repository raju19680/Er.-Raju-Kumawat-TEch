import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor Configuration
 * 
 * This config enables the web app to be packaged as a native mobile app
 * for both Android (Play Store) and iOS (App Store).
 * 
 * Each teacher gets their own app with custom:
 * - appId (unique per teacher)
 * - appName (teacher's brand name)
 * - Server URL (teacher's portal)
 */

const config: CapacitorConfig = {
  appId: 'com.errkt.teacher',
  appName: 'Er. Raju Kumawat Tech',
  webDir: 'out',
  server: {
    // For white-label: each teacher's app points to their portal
    // Change this URL per teacher build
    url: process.env.CAPACITOR_SERVER_URL || 'http://localhost:3000',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#ffffffff',
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#ffffffff',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#D97706',
      androidSplashResourceName: 'splash',
      iosSplashResourceName: 'Splash',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#D97706',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
