export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { ZipArchive } from 'archiver'
import { PassThrough } from 'stream'

/**
 * GET /api/admin/download-build?buildId=xxx
 *
 * Downloads a build as a ZIP file. If the build type is:
 * - "website": Generates a standalone Next.js website ZIP for the teacher
 * - "app_android": Generates a Capacitor Android app ZIP
 * - "app_ios": Generates a Capacitor iOS app ZIP
 * - "app_both": Generates both Android + iOS app ZIP
 *
 * The ZIP contains everything needed to deploy:
 * - Source code
 * - package.json with dependencies
 * - .env with teacher's config
 * - README with deployment instructions
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const buildId = req.nextUrl.searchParams.get('buildId')
    if (!buildId) {
      return NextResponse.json({ error: 'buildId is required' }, { status: 400 })
    }

    const build = await db.buildRecord.findUnique({ where: { id: buildId } })
    if (!build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 })
    }

    // Get teacher + org + branding
    const teacher = await db.user.findUnique({
      where: { id: build.teacherId },
      include: { organization: true },
    })
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const branding = await db.whiteLabelConfig.findUnique({
      where: { teacherId: build.teacherId },
    })

    const org = teacher.organization
    const orgCode = org?.code || 'TEACHER'
    const appName = branding?.orgName || org?.name || teacher.name || 'Teacher Portal'
    const accentColor = branding?.primaryColor || org?.accentColor || '#D97706'
    const serverUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Create ZIP stream
    const passthrough = new PassThrough()
    const archive = new ZipArchive()

    // Set up archive events
    archive.on('error', (err: Error) => {
      console.error('[DOWNLOAD-BUILD] Archive error:', err)
    })

    archive.pipe(passthrough)

    // ── Generate files based on build type ──
    const isWebsite = build.type === 'website'
    const isAndroid = build.type === 'app_android' || build.type === 'app_both'
    const isIOS = build.type === 'app_ios' || build.type === 'app_both'

    // Common files for all build types
    archive.append(`# ${appName}\n\nTeacher Portal for ${teacher.name}\nOrganization: ${org?.name} (${orgCode})\n\n## Setup\n1. npm install\n2. npm run dev\n3. Open http://localhost:3001\n\n## Build\nnpm run build\n\n## Deploy\nDeploy to Vercel, Netlify, or any hosting platform.\n`, { name: 'README.md' })

    archive.append(`NEXT_PUBLIC_APP_NAME="${appName}"\nNEXT_PUBLIC_ORG_CODE="${orgCode}"\nNEXT_PUBLIC_API_URL="${serverUrl}"\nNEXT_PUBLIC_ACCENT_COLOR="${accentColor}"\n`, { name: '.env.local' })

    // ── Website build ──
    if (isWebsite) {
      // package.json
      archive.append(JSON.stringify({
        name: appName.toLowerCase().replace(/\s+/g, '-'),
        version: build.version,
        private: true,
        scripts: {
          dev: 'next dev -p 3001',
          build: 'next build',
          start: 'next start -p 3001',
        },
        dependencies: {
          next: '^16.1.1',
          react: '^19.0.0',
          'react-dom': '^19.0.0',
        },
      }, null, 2), { name: 'package.json' })

      // next.config.ts
      archive.append(`import type { NextConfig } from "next";\nconst nextConfig: NextConfig = { output: 'standalone' };\nexport default nextConfig;\n`, { name: 'next.config.ts' })

      // Main page - teacher's branded portal
      archive.append(`'use client'
import { useState, useEffect } from 'react'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Teacher Portal'
const ORG_CODE = process.env.NEXT_PUBLIC_ORG_CODE || ''
const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
const ACCENT = process.env.NEXT_PUBLIC_ACCENT_COLOR || '#D97706'

export default function Home() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(\`\${API_URL}/api/public/portal-data?orgCode=\${ORG_CODE}\`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:ACCENT }}>
    <div style={{ color:'#fff',fontSize:24,fontWeight:'bold' }}>\${APP_NAME}</div>
  </div>

  const branding = data?.branding || {}
  const content = data?.content || {}

  return (
    <div style={{ fontFamily:'system-ui,sans-serif',margin:0,padding:0 }}>
      <header style={{ background:ACCENT,color:'#fff',padding:'20px',textAlign:'center' }}>
        <h1 style={{ margin:0,fontSize:28 }}>{branding.orgName || APP_NAME}</h1>
        {branding.heroSubtitle && <p style={{ margin:'8px 0 0',opacity:0.9 }}>{branding.heroSubtitle}</p>}
      </header>

      <main style={{ maxWidth:1200,margin:'0 auto',padding:20 }}>
        {content.courses?.length > 0 && (
          <section style={{ marginBottom:40 }}>
            <h2 style={{ fontSize:22,marginBottom:16 }}>Courses</h2>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16 }}>
              {content.courses.map((c:any) => (
                <div key={c.id} style={{ border:'1px solid #e5e7eb',borderRadius:12,padding:16 }}>
                  <h3 style={{ margin:'0 0 8px',fontSize:18 }}>{c.title}</h3>
                  <p style={{ color:'#6b7280',fontSize:14,marginBottom:8 }}>{c.description}</p>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                    <span style={{ fontWeight:'bold',color:ACCENT }}>₹{c.price}</span>
                    {c.mrp > c.price && <span style={{ textDecoration:'line-through',color:'#9ca3af' }}>₹{c.mrp}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {content.testSeries?.length > 0 && (
          <section style={{ marginBottom:40 }}>
            <h2 style={{ fontSize:22,marginBottom:16 }}>Test Series</h2>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16 }}>
              {content.testSeries.map((t:any) => (
                <div key={t.id} style={{ border:'1px solid #e5e7eb',borderRadius:12,padding:16 }}>
                  <h3 style={{ margin:'0 0 8px',fontSize:18 }}>{t.title}</h3>
                  <p style={{ color:'#6b7280',fontSize:14,marginBottom:8 }}>{t.description}</p>
                  <span style={{ fontWeight:'bold',color:ACCENT }}>₹{t.price}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={{ textAlign:'center',padding:40,background:'#f9fafb',borderRadius:12,marginBottom:20 }}>
          <h2 style={{ fontSize:22,marginBottom:8 }}>Ready to start learning?</h2>
          <p style={{ color:'#6b7280',marginBottom:16 }}>Login to access your courses and tests</p>
          <a href={\`\${API_URL}/?orgCode=\${ORG_CODE}\`} style={{ display:'inline-block',background:ACCENT,color:'#fff',padding:'12px 32px',borderRadius:8,textDecoration:'none',fontWeight:'bold' }}>
            Login Now
          </a>
        </section>
      </main>

      <footer style={{ background:'#1f2937',color:'#fff',padding:20,textAlign:'center' }}>
        <p style={{ margin:0,fontSize:14 }}>{branding.footerText || \`© \${new Date().getFullYear()} \${APP_NAME}. All Rights Reserved.\`}</p>
      </footer>
    </div>
  )
}
`, { name: 'src/app/page.tsx' })

      archive.append(`export const metadata = { title: '${appName}', description: '${branding?.seoDescription || appName}' };\n`, { name: 'src/app/layout.tsx' })

      archive.append(`import './globals.css';\n`, { name: 'src/app/globals.css' })
    }

    // ── Mobile App build (Capacitor) ──
    if (isAndroid || isIOS) {
      // Capacitor config
      const appId = `com.errkt.${orgCode.toLowerCase()}`
      archive.append(`import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: '${appId}',
  appName: '${appName}',
  webDir: 'www',
  server: {
    url: '${serverUrl}',
    cleartext: true,
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
  },
}

export default config
`, { name: 'capacitor.config.ts' })

      // package.json for mobile app
      archive.append(JSON.stringify({
        name: appName.toLowerCase().replace(/\s+/g, '-'),
        version: build.version,
        private: true,
        scripts: {
          build: 'next build && cap sync',
          android: 'next build && cap sync android && cap open android',
          ios: 'next build && cap sync ios && cap open ios',
        },
        dependencies: {
          '@capacitor/core': '^8.0.0',
          '@capacitor/android': '^8.0.0',
          '@capacitor/ios': '^8.0.0',
          '@capacitor/splash-screen': '^8.0.0',
          '@capacitor/status-bar': '^8.0.0',
        },
        devDependencies: {
          '@capacitor/cli': '^8.0.0',
        },
      }, null, 2), { name: 'package.json' })

      // README with store upload instructions
      archive.append(`# ${appName} - Mobile App

## App Details
- App ID: ${appId}
- App Name: ${appName}
- Version: ${build.version}
- Server: ${serverUrl}

## Build Instructions

### Android (Play Store)
1. npm install
2. npm run android
3. In Android Studio: Build > Generate Signed Bundle (AAB)
4. Upload AAB to play.google.com/console

### iOS (App Store)
1. npm install
2. npm run ios
3. In Xcode: Product > Archive
4. Upload to App Store Connect

## Requirements
- Android Studio (for Android)
- Xcode (for iOS, macOS only)
- Node.js 18+
`, { name: 'MOBILE_README.md' })
    }

    // Finalize archive
    archive.finalize()

    // Convert stream to response
    const chunks: Buffer[] = []
    for await (const chunk of passthrough) {
      chunks.push(Buffer.from(chunk))
    }
    const buffer = Buffer.concat(chunks)

    // Update build record
    await db.buildRecord.update({
      where: { id: build.id },
      data: {
        status: 'completed',
        fileSize: buffer.length,
        filename: `${build.type}-${orgCode}-v${build.version}.zip`,
        completedAt: new Date(),
      },
    })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${build.type}-${orgCode}-v${build.version}.zip"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[DOWNLOAD-BUILD] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
