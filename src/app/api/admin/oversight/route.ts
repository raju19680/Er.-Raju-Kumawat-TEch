export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  // ── Auth check ──
  const authResult = await requirePlatformAdmin(req)
  if ('error' in authResult) {
    return NextResponse.json(
      { success: false, message: authResult.error },
      { status: authResult.status }
    )
  }

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''
    const orgFilter = searchParams.get('organizationId')?.trim() || ''

    // Build organization filter
    const orgWhere = orgFilter ? { organizationId: orgFilter } : {}

    // Build search filter helper
    function buildSearchFilter(searchFields: string[]) {
      if (!search) return orgWhere
      return {
        ...orgWhere,
        OR: searchFields.map((field) => ({
          [field]: { contains: search },
        })),
      }
    }

    // ── Fetch all oversight data in parallel ──
    const [coupons, leads, supportQueries, quickLinks, categories] = await Promise.all([
      db.coupon.findMany({
        where: buildSearchFilter(['code']),
        select: {
          id: true,
          code: true,
          discount: true,
          discountType: true,
          maxUses: true,
          usedCount: true,
          validFrom: true,
          validTo: true,
          isActive: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.lead.findMany({
        where: buildSearchFilter(['name', 'email', 'phone', 'source']),
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          source: true,
          status: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.supportQuery.findMany({
        where: buildSearchFilter(['subject', 'studentName', 'studentEmail']),
        select: {
          id: true,
          subject: true,
          message: true,
          status: true,
          studentName: true,
          studentEmail: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.quickLink.findMany({
        where: buildSearchFilter(['title', 'url']),
        select: {
          id: true,
          title: true,
          url: true,
          icon: true,
          sortOrder: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      db.category.findMany({
        where: buildSearchFilter(['name', 'slug']),
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // ── Compute stats ──
    const [
      totalCoupons,
      activeCoupons,
      totalLeads,
      newLeads,
      totalSupport,
      openSupport,
      totalQuickLinks,
      totalCategories,
    ] = await Promise.all([
      db.coupon.count({ where: orgWhere }),
      db.coupon.count({ where: { ...orgWhere, isActive: true } }),
      db.lead.count({ where: orgWhere }),
      db.lead.count({ where: { ...orgWhere, status: 'new' } }),
      db.supportQuery.count({ where: orgWhere }),
      db.supportQuery.count({ where: { ...orgWhere, status: 'open' } }),
      db.quickLink.count({ where: orgWhere }),
      db.category.count({ where: orgWhere }),
    ])

    // ── Fetch organizations for filter ──
    const organizations = await db.organization.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      coupons,
      leads,
      supportQueries,
      quickLinks,
      categories,
      organizations,
      stats: {
        totalCoupons,
        activeCoupons,
        totalLeads,
        newLeads,
        totalSupport,
        openSupport,
        totalQuickLinks,
        totalCategories,
      },
    })
  } catch (error) {
    console.error('[ADMIN/OVERSIGHT] Error fetching oversight data:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch oversight data.' },
      { status: 500 }
    )
  }
}
