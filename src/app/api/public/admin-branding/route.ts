import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const revalidate = 0 // Don't cache

export async function GET(req: NextRequest) {
  try {
    // ALWAYS return platform admin branding for the CMS / Admin portal
    const admin = await db.user.findFirst({
      where: { 
        role: 'platform_admin',
        email: 'rajulalkumawat1995@gmail.com'
      },
      select: { avatar: true, name: true },
    }) || await db.user.findFirst({
      where: { role: 'platform_admin' },
      select: { avatar: true, name: true },
    });

    return NextResponse.json({
      success: true,
      logo: admin?.avatar || null,
      name: admin?.name || 'Er. Raju Kumawat Tech',
    })
  } catch (error) {
    console.error('Admin branding fetch error:', error)
    return NextResponse.json({ success: false, logo: null, name: 'Er. Raju Kumawat Tech' })
  }
}
