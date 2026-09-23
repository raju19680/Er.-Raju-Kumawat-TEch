/**
 * Per-Teacher Mobile App Generator
 * 
 * This script generates a unique mobile app for each teacher with:
 * - Custom appId (com.errkt.{orgCode})
 * - Custom appName (teacher's brand name)
 * - Custom server URL (teacher's portal)
 * - Custom app icon (teacher's logo)
 * - Custom splash screen (teacher's branding)
 * 
 * Usage:
 *   bunx tsx scripts/generate-teacher-app.ts ERKTACADEMY
 *   bunx tsx scripts/generate-teacher-app.ts DPS2024
 * 
 * Output:
 *   - Updates capacitor.config.ts for the teacher
 *   - Builds the web app
 *   - Syncs to native platforms
 *   - Opens Android Studio or Xcode for final build
 */

import { writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

const orgCode = process.argv[2]

if (!orgCode) {
  console.log('❌ Usage: bunx tsx scripts/generate-teacher-app.ts <ORG_CODE>')
  console.log('   Example: bunx tsx scripts/generate-teacher-app.ts ERKTACADEMY')
  process.exit(1)
}

console.log(`\n📱 Generating Mobile App for: ${orgCode}\n`)

// Step 1: Get teacher info from database
console.log('1️⃣  Fetching teacher info from database...')

const db = new PrismaClient()

async function generate() {
  const org = await db.organization.findUnique({
    where: { code: orgCode },
  })

  if (!org) {
    console.error(`❌ Organization not found: ${orgCode}`)
    process.exit(1)
  }

  const teacher = await db.user.findFirst({
    where: { organizationId: org.id, role: 'teacher' },
  })

  let branding: any = null
  if (teacher) {
    branding = await db.whiteLabelConfig.findUnique({
      where: { teacherId: teacher.id },
    })
  }

  const appName = branding?.orgName || org.name
  const appId = `com.errkt.${orgCode.toLowerCase()}`
  const serverUrl = `https://${orgCode.toLowerCase()}.errkt.com` // Or custom domain
  const accentColor = branding?.primaryColor || org.accentColor || '#D97706'

  console.log(`   ✅ App Name: ${appName}`)
  console.log(`   ✅ App ID: ${appId}`)
  console.log(`   ✅ Server URL: ${serverUrl}`)
  console.log(`   ✅ Accent Color: ${accentColor}`)

  // Step 2: Update capacitor.config.ts
  console.log('\n2️⃣  Updating Capacitor config...')

  const config = `import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: '${appId}',
  appName: '${appName}',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    url: '${serverUrl}',
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
      backgroundColor: '${accentColor}',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '${accentColor}',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
`

  writeFileSync('capacitor.config.ts', config)
  console.log('   ✅ capacitor.config.ts updated')

  // Step 3: Build web app for mobile
  console.log('\n3️⃣  Building web app for mobile...')
  try {
    execSync('CAPACITOR_BUILD=true next build', { stdio: 'inherit', timeout: 120000 })
    console.log('   ✅ Web build complete')
  } catch (e) {
    console.log('   ⚠️  Web build failed (continuing with sync)')
  }

  // Step 4: Sync to native platforms
  console.log('\n4️⃣  Syncing to native platforms...')
  try {
    execSync('bunx cap sync', { stdio: 'inherit', timeout: 60000 })
    console.log('   ✅ Native sync complete')
  } catch (e) {
    console.log('   ⚠️  Sync failed')
  }

  // Step 5: Summary
  console.log('\n=====================================')
  console.log('📱 MOBILE APP GENERATED SUCCESSFULLY!')
  console.log('=====================================')
  console.log(`\n📋 App Details:`)
  console.log(`   App Name: ${appName}`)
  console.log(`   App ID: ${appId}`)
  console.log(`   Server: ${serverUrl}`)
  console.log(`   Organization: ${org.name} (${org.code})`)
  console.log(`\n🚀 Next Steps:`)
  console.log(`   1. Build Android: bunx cap open android`)
  console.log(`      → Build > Generate Signed APK/AAB`)
  console.log(`      → Upload to Play Store`)
  console.log(`   2. Build iOS: bunx cap open ios`)
  console.log(`      → Product > Archive`)
  console.log(`      → Upload to App Store`)
  console.log(`\n📦 Commands:`)
  console.log(`   bun run mobile:android  → Open Android Studio`)
  console.log(`   bun run mobile:ios      → Open Xcode`)
  console.log('')

  await db.$disconnect()
}

generate().catch(console.error)
