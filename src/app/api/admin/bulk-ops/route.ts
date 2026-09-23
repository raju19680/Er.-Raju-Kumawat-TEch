export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

// ── Allowed export/import types ──────────────────────────────────────────────
const VALID_TYPES = ['students', 'teachers', 'orders', 'organizations'] as const
type BulkType = (typeof VALID_TYPES)[number]

function isValidType(t: string): t is BulkType {
  return VALID_TYPES.includes(t as BulkType)
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function sanitize(str: unknown): string {
  if (typeof str !== 'string') return ''
  return str.trim().slice(0, 500)
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ── GET: Export data as JSON ─────────────────────────────────────────────────
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
    const type = searchParams.get('type')?.trim() || ''

    if (!isValidType(type)) {
      return NextResponse.json(
        { success: false, message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    let data: any[] = []
    let count = 0

    switch (type) {
      case 'students': {
        const students = await db.student.findMany({
          include: {
            organization: { select: { id: true, name: true, code: true } },
          },
          orderBy: { createdAt: 'desc' },
        })
        data = students.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          isActive: s.isActive,
          isBlocked: s.isBlocked,
          organizationId: s.organizationId,
          organization: s.organization?.name || '',
          createdAt: s.createdAt,
        }))
        count = data.length
        break
      }

      case 'teachers': {
        const teachers = await db.user.findMany({
          where: { role: 'teacher' },
          include: {
            organization: { select: { id: true, name: true, code: true } },
          },
          orderBy: { createdAt: 'desc' },
        })
        data = teachers.map((t) => ({
          id: t.id,
          name: t.name,
          email: t.email,
          phone: t.phone,
          role: t.role,
          organizationId: t.organizationId,
          organization: t.organization?.name || '',
          createdAt: t.createdAt,
        }))
        count = data.length
        break
      }

      case 'orders': {
        const orders = await db.order.findMany({
          include: {
            student: { select: { id: true, name: true, email: true } },
            organization: { select: { id: true, name: true, code: true } },
          },
          orderBy: { createdAt: 'desc' },
        })
        data = orders.map((o) => ({
          id: o.id,
          studentId: o.studentId,
          studentName: o.student?.name || '',
          totalAmount: o.totalAmount,
          discountAmount: o.discountAmount,
          finalAmount: o.finalAmount,
          status: o.status,
          couponCode: o.couponCode,
          organizationId: o.organizationId,
          organization: o.organization?.name || '',
          createdAt: o.createdAt,
        }))
        count = data.length
        break
      }

      case 'organizations': {
        const orgs = await db.organization.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { users: true, students: true, courses: true } },
          },
        })
        data = orgs.map((o) => ({
          id: o.id,
          name: o.name,
          code: o.code,
          phone: o.phone,
          status: o.status,
          accentColor: o.accentColor,
          adminCommission: o.adminCommission,
          gatewayCharge: o.gatewayCharge,
          userCount: o._count.users,
          studentCount: o._count.students,
          courseCount: o._count.courses,
          createdAt: o.createdAt,
        }))
        count = data.length
        break
      }
    }

    // ── Audit log ──
    await db.auditLog.create({
      data: {
        userId: authResult.user.id,
        userName: authResult.user.name,
        userRole: authResult.user.role,
        action: `bulk.export.${type}`,
        category: 'system',
        details: JSON.stringify({ type, recordCount: count }),
        organizationId: authResult.user.orgId || null,
      },
    })

    return NextResponse.json({
      success: true,
      type,
      count,
      data,
      exportedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Bulk export error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error during export.' },
      { status: 500 }
    )
  }
}

// ── POST: Import data from JSON ──────────────────────────────────────────────
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
    const { type, data } = body as { type: string; data: any[] }

    if (!isValidType(type)) {
      return NextResponse.json(
        { success: false, message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { success: false, message: 'Data must be an array of records.' },
        { status: 400 }
      )
    }

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No records to import.' },
        { status: 400 }
      )
    }

    if (data.length > 5000) {
      return NextResponse.json(
        { success: false, message: 'Maximum 5000 records per import.' },
        { status: 400 }
      )
    }

    const errors: { row: number; message: string }[] = []
    let imported = 0

    for (let i = 0; i < data.length; i++) {
      const record = data[i]
      try {
        switch (type as BulkType) {
          case 'students': {
            const name = sanitize(record.name)
            const email = sanitize(record.email)
            const phone = sanitize(record.phone) || null
            const organizationId = sanitize(record.organizationId)

            if (!name) { errors.push({ row: i + 1, message: 'Name is required' }); continue }
            if (!email || !isValidEmail(email)) { errors.push({ row: i + 1, message: 'Valid email is required' }); continue }
            if (!organizationId) { errors.push({ row: i + 1, message: 'organizationId is required' }); continue }

            // Verify organization exists
            const orgExists = await db.organization.findUnique({ where: { id: organizationId } })
            if (!orgExists) { errors.push({ row: i + 1, message: `Organization "${organizationId}" not found` }); continue }

            // Check for duplicate email
            const existing = await db.student.findFirst({ where: { email } })
            if (existing) { errors.push({ row: i + 1, message: `Student with email "${email}" already exists` }); continue }

            await db.student.create({
              data: {
                name,
                email,
                phone,
                organizationId,
                isActive: typeof record.isActive === 'boolean' ? record.isActive : true,
                isBlocked: typeof record.isBlocked === 'boolean' ? record.isBlocked : false,
              },
            })
            imported++
            break
          }

          case 'teachers': {
            const name = sanitize(record.name)
            const email = sanitize(record.email)
            const phone = sanitize(record.phone) || null
            const organizationId = sanitize(record.organizationId)
            const password = sanitize(record.password) || 'TempPass123!'

            if (!name) { errors.push({ row: i + 1, message: 'Name is required' }); continue }
            if (!email || !isValidEmail(email)) { errors.push({ row: i + 1, message: 'Valid email is required' }); continue }

            // Check for duplicate email
            const existingUser = await db.user.findFirst({ where: { email } })
            if (existingUser) { errors.push({ row: i + 1, message: `User with email "${email}" already exists` }); continue }

            // Validate organization if provided
            if (organizationId) {
              const orgExists = await db.organization.findUnique({ where: { id: organizationId } })
              if (!orgExists) { errors.push({ row: i + 1, message: `Organization "${organizationId}" not found` }); continue }
            }

            await db.user.create({
              data: {
                name,
                email,
                password,
                phone,
                role: 'teacher',
                organizationId: organizationId || null,
              },
            })
            imported++
            break
          }

          case 'orders': {
            const studentId = sanitize(record.studentId)
            const organizationId = sanitize(record.organizationId)
            const totalAmount = Number(record.totalAmount)
            const finalAmount = Number(record.finalAmount)

            if (!studentId) { errors.push({ row: i + 1, message: 'studentId is required' }); continue }
            if (!organizationId) { errors.push({ row: i + 1, message: 'organizationId is required' }); continue }
            if (isNaN(totalAmount) || totalAmount < 0) { errors.push({ row: i + 1, message: 'Valid totalAmount is required' }); continue }

            // Verify student exists
            const studentExists = await db.student.findUnique({ where: { id: studentId } })
            if (!studentExists) { errors.push({ row: i + 1, message: `Student "${studentId}" not found` }); continue }

            // Verify organization
            const orgExists = await db.organization.findUnique({ where: { id: organizationId } })
            if (!orgExists) { errors.push({ row: i + 1, message: `Organization "${organizationId}" not found` }); continue }

            await db.order.create({
              data: {
                studentId,
                organizationId,
                items: typeof record.items === 'string' ? record.items : JSON.stringify(record.items || []),
                totalAmount,
                discountAmount: Number(record.discountAmount) || 0,
                finalAmount: isNaN(finalAmount) ? totalAmount : finalAmount,
                status: sanitize(record.status) || 'pending',
                couponCode: sanitize(record.couponCode) || null,
              },
            })
            imported++
            break
          }

          case 'organizations': {
            const name = sanitize(record.name)
            const code = sanitize(record.code)

            if (!name) { errors.push({ row: i + 1, message: 'Name is required' }); continue }
            if (!code) { errors.push({ row: i + 1, message: 'Code is required' }); continue }

            // Check for duplicate code
            const existingOrg = await db.organization.findFirst({ where: { code } })
            if (existingOrg) { errors.push({ row: i + 1, message: `Organization with code "${code}" already exists` }); continue }

            await db.organization.create({
              data: {
                name,
                code,
                phone: sanitize(record.phone) || null,
                status: sanitize(record.status) || 'trial',
                accentColor: sanitize(record.accentColor) || '#111111',
                adminCommission: Number(record.adminCommission) || 20,
                gatewayCharge: Number(record.gatewayCharge) || 2.36,
              },
            })
            imported++
            break
          }
        }
      } catch (recordError) {
        const msg = recordError instanceof Error ? recordError.message : 'Unknown error'
        errors.push({ row: i + 1, message: msg.slice(0, 200) })
      }
    }

    // ── Audit log ──
    await db.auditLog.create({
      data: {
        userId: authResult.user.id,
        userName: authResult.user.name,
        userRole: authResult.user.role,
        action: `bulk.import.${type}`,
        category: 'system',
        details: JSON.stringify({ type, totalRecords: data.length, imported, errorsCount: errors.length }),
        organizationId: authResult.user.orgId || null,
      },
    })

    return NextResponse.json({
      success: true,
      imported,
      total: data.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Imported ${imported} of ${data.length} ${type}${errors.length > 0 ? `. ${errors.length} record(s) had errors.` : ''}`,
    })
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error during import.' },
      { status: 500 }
    )
  }
}
