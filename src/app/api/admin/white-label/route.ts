export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

// ── GET: Fetch white-label config, build records, and custom domains ──────────
export async function GET(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get('teacherId')
    const section = searchParams.get('section') || 'all'

    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: 'teacherId is required' },
        { status: 400 }
      )
    }

    // Verify teacher exists
    const teacher = await db.user.findUnique({
      where: { id: teacherId, role: 'teacher' },
      include: { organization: true },
    })
    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found' },
        { status: 404 }
      )
    }

    const result: Record<string, any> = { success: true }

    // Fetch config
    if (section === 'config' || section === 'all') {
      let config = await db.whiteLabelConfig.findUnique({
        where: { teacherId },
      })
      if (!config) {
        // Create default config
        config = await db.whiteLabelConfig.create({
          data: {
            teacherId,
            orgName: teacher.organization?.name || teacher.name,
            accentColor: teacher.organization?.accentColor || '#d97706',
            primaryColor: teacher.organization?.accentColor || '#d97706',
          },
        })
      }
      result.config = config
    }

    // Fetch build records
    if (section === 'builds' || section === 'all') {
      const builds = await db.buildRecord.findMany({
        where: { teacherId },
        orderBy: { createdAt: 'desc' },
      })
      result.builds = builds
    }

    // Fetch custom domains
    if (section === 'domains' || section === 'all') {
      const domains = await db.customDomain.findMany({
        where: { teacherId },
        orderBy: { createdAt: 'desc' },
      })
      result.domains = domains
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('White-label GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ── POST: Save/update config, add/verify/delete domain, rebuild ───────────────
export async function POST(req: NextRequest) {
  try {
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'save_config':
        return await handleSaveConfig(body, authResult.user)
      case 'add_domain':
        return await handleAddDomain(body)
      case 'verify_domain':
        return await handleVerifyDomain(body)
      case 'delete_domain':
        return await handleDeleteDomain(body)
      case 'rebuild':
        return await handleRebuild(body, authResult.user)
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('White-label POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ── Save / Update White-Label Config ──────────────────────────────────────────
async function handleSaveConfig(
  body: Record<string, any>,
  adminUser: { id: string; name: string }
) {
  const { teacherId, config } = body
  if (!teacherId || !config) {
    return NextResponse.json(
      { success: false, message: 'teacherId and config are required' },
      { status: 400 }
    )
  }

  // Verify teacher exists
  const teacher = await db.user.findUnique({
    where: { id: teacherId },
  })
  if (!teacher) {
    return NextResponse.json(
      { success: false, message: 'Teacher not found' },
      { status: 404 }
    )
  }

  // Parse social links to JSON string if it's an object
  let socialLinksStr = config.socialLinks
  if (socialLinksStr && typeof socialLinksStr === 'object') {
    socialLinksStr = JSON.stringify(socialLinksStr)
  }

  const upsertData = {
    orgName: config.orgName || teacher.name,
    logo: config.logo || null,
    favicon: config.favicon || null,
    primaryColor: config.primaryColor || '#d97706',
    secondaryColor: config.secondaryColor || null,
    accentColor: config.accentColor || '#d97706',
    fontFamily: config.fontFamily || 'Inter',
    customCSS: config.customCSS || null,
    heroTitle: config.heroTitle || null,
    heroSubtitle: config.heroSubtitle || null,
    heroImage: config.heroImage || null,
    footerText: config.footerText || null,
    socialLinks: socialLinksStr || null,
    seoTitle: config.seoTitle || null,
    seoDescription: config.seoDescription || null,
    pwaEnabled: config.pwaEnabled ?? false,
    analyticsId: config.analyticsId || null,
    facebookPixelId: config.facebookPixelId || null,
    templateId: config.templateId || 'default',
    publishedAt: new Date(),
  }

  const saved = await db.whiteLabelConfig.upsert({
    where: { teacherId },
    update: upsertData,
    create: {
      teacherId,
      ...upsertData,
    },
  })

  // Sync accent color back to organization if changed
  if (config.accentColor && teacher.organizationId) {
    await db.organization.update({
      where: { id: teacher.organizationId },
      data: { accentColor: config.accentColor },
    })
  }

  // Log audit
  await db.auditLog.create({
    data: {
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: 'platform_admin',
      action: 'whitelabel.config_save',
      category: 'teacher',
      details: JSON.stringify({ teacherId }),
    },
  })

  return NextResponse.json({ success: true, config: saved })
}

// ── Add Custom Domain ─────────────────────────────────────────────────────────
async function handleAddDomain(body: Record<string, any>) {
  const { teacherId, domain, organizationId, targetType } = body
  if (!teacherId || !domain || !organizationId) {
    return NextResponse.json(
      { success: false, message: 'teacherId, domain, and organizationId are required' },
      { status: 400 }
    )
  }

  // Check for duplicate domain
  const existing = await db.customDomain.findUnique({
    where: { domain },
  })
  if (existing) {
    return NextResponse.json(
      { success: false, message: 'Domain already registered' },
      { status: 409 }
    )
  }

  const newDomain = await db.customDomain.create({
    data: {
      teacherId,
      domain,
      organizationId,
      targetType: targetType || 'website',
      status: 'pending',
      isVerified: false,
      sslEnabled: false,
    },
  })

  return NextResponse.json({ success: true, domain: newDomain })
}

// ── Verify Custom Domain (simulates DNS verification) ────────────────────────
async function handleVerifyDomain(body: Record<string, any>) {
  const { domainId } = body
  if (!domainId) {
    return NextResponse.json(
      { success: false, message: 'domainId is required' },
      { status: 400 }
    )
  }

  const existing = await db.customDomain.findUnique({
    where: { id: domainId },
  })
  if (!existing) {
    return NextResponse.json(
      { success: false, message: 'Domain not found' },
      { status: 404 }
    )
  }

  // Simulate DNS verification — in production, check CNAME/A records
  const verified = await db.customDomain.update({
    where: { id: domainId },
    data: {
      status: 'active',
      isVerified: true,
      sslEnabled: true,
      dnsVerifiedAt: new Date(),
      sslProvisionedAt: new Date(),
    },
  })

  return NextResponse.json({ success: true, domain: verified })
}

// ── Delete Custom Domain ──────────────────────────────────────────────────────
async function handleDeleteDomain(body: Record<string, any>) {
  const { domainId } = body
  if (!domainId) {
    return NextResponse.json(
      { success: false, message: 'domainId is required' },
      { status: 400 }
    )
  }

  const existing = await db.customDomain.findUnique({
    where: { id: domainId },
  })
  if (!existing) {
    return NextResponse.json(
      { success: false, message: 'Domain not found' },
      { status: 404 }
    )
  }

  await db.customDomain.delete({
    where: { id: domainId },
  })

  return NextResponse.json({ success: true })
}

// ── Create Build Record ───────────────────────────────────────────────────────
async function handleRebuild(
  body: Record<string, any>,
  adminUser: { id: string; name: string }
) {
  const { teacherId, type, changelog } = body
  if (!teacherId || !type) {
    return NextResponse.json(
      { success: false, message: 'teacherId and type are required' },
      { status: 400 }
    )
  }

  // Verify teacher exists
  const teacher = await db.user.findUnique({
    where: { id: teacherId },
    include: { organization: true },
  })
  if (!teacher) {
    return NextResponse.json(
      { success: false, message: 'Teacher not found' },
      { status: 404 }
    )
  }

  // Get current config snapshot
  const config = await db.whiteLabelConfig.findUnique({
    where: { teacherId },
  })

  // Get module access snapshot
  const moduleAccess = await db.teacherModuleAccess.findMany({
    where: { teacherId },
  })

  // Determine version — increment from latest build
  const latestBuild = await db.buildRecord.findFirst({
    where: { teacherId, type },
    orderBy: { createdAt: 'desc' },
  })
  let version = '1.0.0'
  if (latestBuild?.version) {
    const parts = latestBuild.version.split('.')
    const patch = parseInt(parts[2] || '0') + 1
    version = `${parts[0]}.${parts[1]}.${patch}`
  }

  const build = await db.buildRecord.create({
    data: {
      teacherId,
      teacherName: teacher.name,
      organizationId: teacher.organizationId || '',
      type,
      status: 'pending',
      version,
      changelog: changelog || null,
      triggeredBy: adminUser.id,
      triggeredByName: adminUser.name,
    },
  })

  // Simulate build completion after a short delay (in production, this would be a background job)
  setTimeout(async () => {
    try {
      await db.buildRecord.update({
        where: { id: build.id },
        data: {
          status: 'completed',
          startedAt: new Date(),
          completedAt: new Date(),
          fileSize: Math.floor(Math.random() * 5000000) + 1000000, // 1-6 MB simulated
          filename: `${type}-${teacher.organization?.code || 'build'}-v${version}.zip`,
        },
      })
    } catch (err) {
      console.error('Build completion simulation error:', err)
    }
  }, 3000)

  return NextResponse.json({ success: true, build })
}
