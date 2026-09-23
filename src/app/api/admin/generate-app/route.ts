export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { ZipArchive } from 'archiver'
import { PassThrough, Readable } from 'stream'
import * as fs from 'fs'
import * as path from 'path'

const TEMPLATE_DIR = '/home/z/my-project/mobile-app'
const EXCLUDED_DIRS = ['node_modules', '.expo', '.git']
const EXCLUDED_FILES = ['bun.lock']

/**
 * Recursively walk a directory and collect all file paths (relative to baseDir).
 * Skips excluded directories and files.
 */
function walkDir(baseDir: string, currentDir: string): string[] {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    // Skip excluded directories
    if (entry.isDirectory() && EXCLUDED_DIRS.includes(entry.name)) {
      continue
    }
    // Skip excluded files
    if (entry.isFile() && EXCLUDED_FILES.includes(entry.name)) {
      continue
    }

    const fullPath = path.join(currentDir, entry.name)
    const relativePath = path.relative(baseDir, fullPath)

    if (entry.isDirectory()) {
      files.push(...walkDir(baseDir, fullPath))
    } else if (entry.isFile()) {
      files.push(relativePath)
    }
  }

  return files
}

/**
 * Generate the module access configuration file content.
 */
function generateModuleAccessConfig(
  teacherName: string,
  orgName: string,
  moduleAccess: { moduleKey: string; enabled: boolean }[]
): string {
  const timestamp = new Date().toISOString()

  const lines: string[] = [
    '// Auto-generated module access configuration for mobile app',
    `// Teacher: ${teacherName}, Organization: ${orgName}`,
    `// Generated at: ${timestamp}`,
    '',
    'export const MODULE_ACCESS: Record<string, boolean> = {',
    "  // Mobile App modules",
    "  'app-auth': true,",
    "  'app-auth.login': true,",
  ]

  if (moduleAccess.length > 0) {
    // Only include mobile-app category modules (app-*)
    const mobileModules = moduleAccess.filter((m) => m.moduleKey.startsWith('app-'))
    for (const mod of mobileModules) {
      lines.push(`  '${mod.moduleKey}': ${mod.enabled},`)
    }
  } else {
    // No records exist — all features enabled by default
    lines.push('  // No module access records — all features enabled by default')
  }

  lines.push('}')
  lines.push('')
  lines.push('export const isModuleEnabled = (key: string): boolean => {')
  lines.push('  return MODULE_ACCESS[key] !== false')
  lines.push('}')
  lines.push('')

  return lines.join('\n')
}

/**
 * Generate the .env file content with Expo environment variables.
 */
function generateEnvFile(orgCode: string, apiBaseUrl: string, appName: string): string {
  return [
    `EXPO_PUBLIC_TEACHER_ID=${orgCode}`,
    `EXPO_PUBLIC_API_BASE_URL=${apiBaseUrl}`,
    `EXPO_PUBLIC_APP_NAME=${appName}`,
    '',
  ].join('\n')
}

/**
 * Generate the README.md content with build instructions.
 */
function generateReadme(orgName: string, orgCode: string, apiBaseUrl: string): string {
  return `# ${orgName} — Teacher Mobile App

Auto-generated Expo/React Native mobile app for **${orgName}**.

- **Organization Code**: ${orgCode}
- **API Base URL**: ${apiBaseUrl}
- **Generated at**: ${new Date().toISOString()}

---

## Prerequisites

- **Node.js** v18 or later — [Download](https://nodejs.org/)
- **Expo CLI** — installed via npx (no global install needed)
- **Android Studio** (for Android builds) — [Download](https://developer.android.com/studio)
- **Xcode** (for iOS builds, macOS only) — [Download](https://developer.apple.com/xcode/)
- **EAS CLI** (optional, for cloud builds) — \`npm install -g eas-cli\`

---

## Setup

\`\`\`bash
# Install dependencies
npm install
\`\`\`

---

## Development

\`\`\`bash
# Start the Expo dev server
npx expo start
\`\`\`

This opens the Expo Dev Tools in your browser. Scan the QR code with the **Expo Go** app on your phone, or press:

- \`a\` — open in Android emulator
- \`i\` — open in iOS simulator
- \`w\` — open in web browser

---

## Build APK (Android)

### Option 1: Local build (requires Android Studio)

\`\`\`bash
# Create a development build
npx expo run:android

# Or create a preview/release APK
cd android && ./gradlew assembleRelease
\`\`\`

### Option 2: EAS Build (cloud)

\`\`\`bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android --profile preview
\`\`\`

---

## Build iOS

### Option 1: Local build (requires macOS + Xcode)

\`\`\`bash
# Create a development build
npx expo run:ios
\`\`\`

### Option 2: EAS Build (cloud)

\`\`\`bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --platform ios --profile preview
\`\`\`

---

## Environment Configuration

Environment variables are set in the \`.env\` file:

| Variable | Description |
|---|---|
| \`EXPO_PUBLIC_TEACHER_ID\` | Organization code used to identify the teacher platform |
| \`EXPO_PUBLIC_API_BASE_URL\` | Backend API base URL |
| \`EXPO_PUBLIC_APP_NAME\` | Display name of the app |

These values are also available in \`app.json\` under \`expo.extra\` for runtime access via \`expo-constants\`.

---

## Project Structure

\`\`\`
mobile-app/
├── App.tsx                  # Entry point
├── app.json                 # Expo configuration
├── src/
│   ├── config/              # App configuration
│   │   ├── index.ts         # Main config (API URL, teacher ID, etc.)
│   │   └── module-access.ts # Feature flags for modules
│   ├── navigation/          # React Navigation setup
│   ├── screens/             # Screen components
│   │   ├── auth/            # Login, Register, OTP
│   │   ├── home/            # Dashboard
│   │   ├── courses/         # Course list & detail
│   │   ├── tests/           # Test series & test taking
│   │   ├── payment/         # Payment screen
│   │   └── profile/         # User profile
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── api/                 # API client
│   ├── store/               # State management
│   ├── theme/               # Theme configuration
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
└── assets/                  # Images & icons
\`\`\`

---

*Built with Expo SDK & React Native*
`
}

/**
 * Modify app.json with teacher-specific configuration.
 */
function modifyAppJson(
  originalContent: string,
  orgName: string,
  orgCode: string,
  apiBaseUrl: string
): string {
  let appConfig: Record<string, any>

  try {
    appConfig = JSON.parse(originalContent)
  } catch {
    // If parsing fails, create a minimal config
    appConfig = { expo: {} }
  }

  if (!appConfig.expo) {
    appConfig.expo = {}
  }

  appConfig.expo.name = orgName
  appConfig.expo.slug = `teacher-app-${orgCode}`

  appConfig.expo.extra = {
    ...(appConfig.expo.extra || {}),
    teacherId: orgCode,
    apiBaseUrl,
    appName: orgName,
  }

  return JSON.stringify(appConfig, null, 2)
}

/**
 * Modify src/config/index.ts with teacher-specific default values.
 */
function modifyConfigTs(content: string, orgCode: string, apiBaseUrl: string, appName: string): string {
  // Replace default teacherId
  content = content.replace(
    /process\.env\.EXPO_PUBLIC_TEACHER_ID\s*\|\|\s*'[^']*'/g,
    `process.env.EXPO_PUBLIC_TEACHER_ID || '${orgCode}'`
  )

  // Replace default apiBaseUrl
  content = content.replace(
    /process\.env\.EXPO_PUBLIC_API_BASE_URL\s*\|\|\s*'[^']*'/g,
    `process.env.EXPO_PUBLIC_API_BASE_URL || '${apiBaseUrl}'`
  )

  // Replace default appName
  content = content.replace(
    /process\.env\.EXPO_PUBLIC_APP_NAME\s*\|\|\s*'[^']*'/g,
    `process.env.EXPO_PUBLIC_APP_NAME || '${appName}'`
  )

  return content
}

/**
 * GET /api/admin/generate-app?teacherId=xxx
 *
 * Generates a downloadable zip of the teacher mobile app (Expo/React Native)
 * with teacher-specific configuration injected.
 */
export async function GET(req: NextRequest) {
  try {
    // ── Auth check: Must be platform_admin ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    // ── Input validation ──
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: 'teacherId query parameter is required.' },
        { status: 400 }
      )
    }

    // ── Look up teacher with organization ──
    const teacher = await db.user.findUnique({
      where: { id: teacherId },
      include: { organization: true },
    })

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found.' },
        { status: 404 }
      )
    }

    if (!teacher.organization) {
      return NextResponse.json(
        { success: false, message: 'Teacher has no associated organization.' },
        { status: 400 }
      )
    }

    const org = teacher.organization

    // ── Get module access for this teacher ──
    const moduleAccess = await db.teacherModuleAccess.findMany({
      where: { teacherId: teacher.id },
    })

    // ── Determine API base URL from request origin ──
    const apiBaseUrl = req.nextUrl.origin

    const orgCode = org.code
    const orgName = org.name

    // ── Verify template directory exists ──
    if (!fs.existsSync(TEMPLATE_DIR)) {
      return NextResponse.json(
        { success: false, message: 'Mobile app template directory not found on server.' },
        { status: 500 }
      )
    }

    // ── Collect all files from template ──
    const templateFiles = walkDir(TEMPLATE_DIR, TEMPLATE_DIR)

    // ── Create zip archive ──
    const archive = new ZipArchive({ zlib: { level: 9 } })
    const passThrough = new PassThrough()
    archive.pipe(passThrough)

    // ── Add each file to archive ──
    for (const relativePath of templateFiles) {
      const fullPath = path.join(TEMPLATE_DIR, relativePath)

      if (relativePath === path.join('src', 'config', 'index.ts')) {
        // Modify config with teacher-specific defaults
        const originalContent = fs.readFileSync(fullPath, 'utf-8')
        const modifiedContent = modifyConfigTs(originalContent, orgCode, apiBaseUrl, orgName)
        archive.append(modifiedContent, { name: relativePath })
      } else if (relativePath === 'app.json') {
        // Modify app.json with teacher-specific config
        const originalContent = fs.readFileSync(fullPath, 'utf-8')
        const modifiedContent = modifyAppJson(originalContent, orgName, orgCode, apiBaseUrl)
        archive.append(modifiedContent, { name: relativePath })
      } else if (relativePath === 'README.md') {
        // Skip template README — we generate a custom one below
        continue
      } else {
        // Add file as-is (binary or text)
        archive.file(fullPath, { name: relativePath })
      }
    }

    // ── Add generated .env file ──
    const envContent = generateEnvFile(orgCode, apiBaseUrl, orgName)
    archive.append(envContent, { name: '.env' })

    // ── Add generated module-access.ts ──
    const moduleAccessContent = generateModuleAccessConfig(
      teacher.name,
      orgName,
      moduleAccess.map((m) => ({ moduleKey: m.moduleKey, enabled: m.enabled }))
    )
    archive.append(moduleAccessContent, { name: path.join('src', 'config', 'module-access.ts') })

    // ── Add generated README.md ──
    const readmeContent = generateReadme(orgName, orgCode, apiBaseUrl)
    archive.append(readmeContent, { name: 'README.md' })

    // ── Finalize the archive ──
    archive.finalize()

    // ── Convert Node.js PassThrough stream to Web ReadableStream ──
    const webStream = new ReadableStream({
      start(controller) {
        passThrough.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk))
        })
        passThrough.on('end', () => {
          controller.close()
        })
        passThrough.on('error', (err) => {
          controller.error(err)
        })
      },
    })

    // ── Stream the zip as the response ──
    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="app-${orgCode}.zip"`,
      },
    })
  } catch (error) {
    console.error('[generate-app] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error while generating app.' },
      { status: 500 }
    )
  }
}
