export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { ALL_ACCESS_KEYS, MODULES } from '@/lib/module-registry'
import { ZipArchive } from 'archiver'
import { PassThrough } from 'stream'
import * as fs from 'fs'
import * as path from 'path'

// ─── Color Mapping: Hex → Tailwind Color Name ────────────────────────────────
const HEX_TO_TAILWIND: Record<string, string> = {
  '#d97706': 'amber',
  '#059669': 'emerald',
  '#7c3aed': 'violet',
  '#dc2626': 'rose',
  '#0891b2': 'cyan',
  '#c026d3': 'pink',
  '#ea580c': 'orange',
  '#4f46e5': 'indigo',
}

function hexToTailwindColor(hex: string | null | undefined): string {
  if (!hex) return 'amber'
  const normalized = hex.toLowerCase().trim()
  return HEX_TO_TAILWIND[normalized] || 'amber'
}

// ─── Directories / files to skip when copying template ───────────────────────
const SKIP_ENTRIES = new Set(['node_modules', '.next', '.git', 'bun.lock'])

// ─── Recursive directory walker ──────────────────────────────────────────────
function walkDir(dir: string, baseDir: string): string[] {
  const results: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (SKIP_ENTRIES.has(entry.name)) continue

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, baseDir))
    } else if (entry.isFile()) {
      results.push(path.relative(baseDir, fullPath))
    }
  }

  return results
}

// ─── Generate module-access-config.ts content ────────────────────────────────
function generateModuleAccessConfig(
  teacherName: string,
  orgName: string,
  accessRecords: { moduleKey: string; enabled: boolean }[]
): string {
  const timestamp = new Date().toISOString()

  // Build the access map: start with all enabled, then apply DB overrides
  const accessMap: Record<string, boolean> = {}
  for (const key of ALL_ACCESS_KEYS) {
    accessMap[key] = true
  }

  // If there are records, apply them (disabled keys set to false)
  if (accessRecords.length > 0) {
    // Records with enabled=false mean that module is disabled
    for (const record of accessRecords) {
      accessMap[record.moduleKey] = record.enabled
    }

    // For cascading disable: if a parent module is disabled, disable its sub-features too
    for (const mod of MODULES) {
      if (mod.cascadingDisable && accessMap[mod.key] === false) {
        for (const sf of mod.subFeatures) {
          accessMap[sf.key] = false
        }
      }
    }
  }

  // Generate the object literal entries
  const entries = Object.entries(accessMap)
    .map(([key, value]) => `  '${key}': ${value}`)
    .join(',\n')

  return `// Auto-generated module access configuration
// Teacher: ${teacherName}, Organization: ${orgName}
// Generated at: ${timestamp}

export const MODULE_ACCESS: Record<string, boolean> = {
${entries}
}

export const isModuleEnabled = (key: string): boolean => {
  return MODULE_ACCESS[key] !== false
}
`
}

// ─── Generate .env.local content ─────────────────────────────────────────────
function generateEnvLocal(orgCode: string, apiUrl: string, orgName: string): string {
  return `NEXT_PUBLIC_TEACHER_ID=${orgCode}
NEXT_PUBLIC_API_URL=${apiUrl}
NEXT_PUBLIC_APP_NAME=${orgName}
`
}

// ─── Generate README.md content ──────────────────────────────────────────────
function generateReadme(orgName: string, orgCode: string): string {
  return `# ${orgName} - Student Website

This is the auto-generated student website for **${orgName}**.

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install
# or
bun install
\`\`\`

### 2. Environment Variables

The \`.env.local\` file has been pre-configured with:

- \`NEXT_PUBLIC_TEACHER_ID=${orgCode}\` — Your organization code
- \`NEXT_PUBLIC_API_URL\` — The platform API URL
- \`NEXT_PUBLIC_APP_NAME=${orgName}\` — Your organization name

**Do not modify these values** unless instructed by the platform administrator.

### 3. Run Development Server

\`\`\`bash
npm run dev
# or
bun run dev
\`\`\`

The site will be available at [http://localhost:3001](http://localhost:3001).

### 4. Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

### 5. Deploy

This is a standard Next.js application. You can deploy it to:

- **Vercel** — Push to GitHub and import in Vercel
- **Netlify** — Use the Next.js adapter
- **Self-hosted** — Build and run with Node.js

Make sure to set the environment variables in your deployment platform.

## Module Access

The file \`src/lib/module-access-config.ts\` controls which features are visible
on the website. This is auto-generated based on your platform subscription.

To update module access, contact the platform administrator.

## Support

For any issues, contact the platform administrator.
`
}

// ─── Replace config.ts placeholders with teacher-specific values ─────────────
function processConfigTs(
  content: string,
  orgCode: string,
  orgName: string,
  tailwindColor: string
): string {
  // Replace the default teacherId
  content = content.replace(
    /process\.env\.NEXT_PUBLIC_TEACHER_ID\s*\|\|\s*'[^']*'/,
    `process.env.NEXT_PUBLIC_TEACHER_ID || '${orgCode}'`
  )

  // Replace the default appName
  content = content.replace(
    /process\.env\.NEXT_PUBLIC_APP_NAME\s*\|\|\s*'[^']*'/,
    `process.env.NEXT_PUBLIC_APP_NAME || '${orgName.replace(/'/g, "\\'")}'`
  )

  // Replace the default accentColor
  content = content.replace(
    /accentColor:\s*'[^']*'/,
    `accentColor: '${tailwindColor}'`
  )

  return content
}

// ─── Main GET Handler ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate — only platform admins
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // 2. Parse input
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json(
        { error: 'teacherId query parameter is required.' },
        { status: 400 }
      )
    }

    // 3. Look up the teacher with organization
    const teacher = await db.user.findUnique({
      where: { id: teacherId },
      include: { organization: true },
    })

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found.' },
        { status: 404 }
      )
    }

    if (!teacher.organization) {
      return NextResponse.json(
        { error: 'Teacher does not have an associated organization.' },
        { status: 400 }
      )
    }

    const org = teacher.organization
    const orgCode = org.code
    const orgName = org.name
    const tailwindColor = hexToTailwindColor(org.accentColor)

    // 4. Get module access for this teacher
    const moduleAccessRecords = await db.teacherModuleAccess.findMany({
      where: { teacherId: teacher.id },
      select: { moduleKey: true, enabled: true },
    })

    // 5. Determine API URL from request origin
    const apiUrl = req.nextUrl.origin

    // 6. Read template directory
    const templateDir = path.resolve('/home/z/my-project/teacher-website')

    if (!fs.existsSync(templateDir)) {
      return NextResponse.json(
        { error: 'Teacher website template not found on server.' },
        { status: 500 }
      )
    }

    // 7. Create the zip archive
    const archive = new ZipArchive({ zlib: { level: 9 } })
    const passThrough = new PassThrough()
    archive.pipe(passThrough)

    const zipRoot = `website-${orgCode}`

    // Collect all template files
    const files = walkDir(templateDir, templateDir)

    for (const relativeFilePath of files) {
      const fullPath = path.join(templateDir, relativeFilePath)
      const archivePath = path.join(zipRoot, relativeFilePath)

      // Process special files
      if (relativeFilePath === path.join('src', 'lib', 'config.ts')) {
        // Replace config values with teacher-specific ones
        let content = fs.readFileSync(fullPath, 'utf-8')
        content = processConfigTs(content, orgCode, orgName, tailwindColor)
        archive.append(content, { name: archivePath })
      } else if (relativeFilePath === 'README.md' || relativeFilePath === '.env.local' || relativeFilePath === '.env.example') {
        // Skip template README and env files — we generate custom ones below
        continue
      } else {
        // Copy file as-is
        archive.file(fullPath, { name: archivePath })
      }
    }

    // 8. Add generated .env.local
    const envContent = generateEnvLocal(orgCode, apiUrl, orgName)
    archive.append(envContent, { name: path.join(zipRoot, '.env.local') })

    // 9. Add generated module-access-config.ts
    const moduleAccessContent = generateModuleAccessConfig(
      teacher.name,
      orgName,
      moduleAccessRecords
    )
    archive.append(moduleAccessContent, {
      name: path.join(zipRoot, 'src', 'lib', 'module-access-config.ts'),
    })

    // 10. Add generated README.md
    const readmeContent = generateReadme(orgName, orgCode)
    archive.append(readmeContent, { name: path.join(zipRoot, 'README.md') })

    // 11. Finalize the archive
    archive.finalize()

    // 12. Convert Node.js PassThrough stream to Web ReadableStream
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

    // 13. Return the zip as response
    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="website-${orgCode}.zip"`,
      },
    })
  } catch (error) {
    console.error('[generate-website] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error while generating website.' },
      { status: 500 }
    )
  }
}
