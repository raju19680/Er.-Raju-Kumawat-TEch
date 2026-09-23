export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const section = searchParams.get('section')
    const email = searchParams.get('email') || auth.email

    if (section === 'org') {
      if (!auth.orgId) {
        return NextResponse.json({ error: 'No organization linked' }, { status: 400 })
      }
      const org = await db.organization.findUnique({
        where: { id: auth.orgId }
      })
      if (!org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
      return NextResponse.json({ 
        success: true, 
        org: {
          name: org.name,
          accentColor: org.accentColor || '#7c3aed',
          logoUrl: org.logo || '',
        }
      })
    }

    // Users can fetch their own profile, platform_admin can fetch any
    if (auth.role !== 'platform_admin' && auth.email !== email) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const user = await db.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(auth?.id ? [{ id: auth.id }] : []),
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        bio: '', // bio not in schema by default
        avatarUrl: user.avatar,
      }
    })
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { section } = body

    if (section === 'org') {
      if (auth.role !== 'platform_admin' && auth.role !== 'teacher') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
      if (!auth.orgId) {
        return NextResponse.json({ error: 'No organization linked' }, { status: 400 })
      }

      const { name, accentColor, logoUrl } = body
      const updateData: Record<string, unknown> = {}
      if (name !== undefined) updateData.name = name
      if (accentColor !== undefined) updateData.accentColor = accentColor
      if (logoUrl !== undefined) updateData.logo = logoUrl

      const updated = await db.organization.update({
        where: { id: auth.orgId },
        data: updateData,
      })

      return NextResponse.json({ success: true, org: updated })
    }

    // Default: update profile
    const { email, name, phone, avatarUrl } = body

    // We can use auth.email if email is not provided
    const targetEmail = email || auth.email
    if (!targetEmail) {
      return NextResponse.json({ error: 'Email is required to identify user' }, { status: 400 })
    }

    // Only allow users to update their own profile, unless they're platform_admin
    if (auth.role !== 'platform_admin' && auth.email !== targetEmail) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const user = await db.user.findUnique({ where: { email: targetEmail } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (avatarUrl !== undefined) updateData.avatar = avatarUrl

    const updated = await db.user.update({
      where: { email: targetEmail },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
      },
    })

    return NextResponse.json({ success: true, profile: updated })
  } catch (error) {
    console.error('Failed to update profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

