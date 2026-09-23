import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    // ── Auth check: Only platform_admin can seed ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }
    // ── Clean up old demo data ──
    await db.loginAttempt.deleteMany({})

    const oldAdmin = await db.user.findUnique({ where: { email: 'superadmin@erraju.com' } })
    if (oldAdmin) {
      await db.user.delete({ where: { id: oldAdmin.id } })
    }

    const oldOrgAdmin = await db.user.findUnique({ where: { email: 'admin@erraju.com' } })
    if (oldOrgAdmin) {
      await db.user.delete({ where: { id: oldOrgAdmin.id } })
    }

    const oldTeacher = await db.user.findUnique({ where: { email: 'teacher@erraju.com' } })
    if (oldTeacher) {
      await db.user.delete({ where: { id: oldTeacher.id } })
    }

    // ── Create PLATFORM Organization for Super Admin ──
    // This is unique — super admin has their OWN institute ID, NEVER shared with any teacher
    const platformOrg = await db.organization.upsert({
      where: { code: '9680177120' },
      update: { name: 'Er. Raju Kumawat Tech — Platform', accentColor: '#D97706', status: 'active', adminCommission: 0, gatewayCharge: 0 },
      create: {
        name: 'Er. Raju Kumawat Tech — Platform',
        code: '9680177120',
        accentColor: '#D97706',
        status: 'active',
        adminCommission: 0,
        gatewayCharge: 0,
      },
    })

    // ── Create Platform Admin (Super Admin) ──
    // Linked to PLATFORM org with unique institute ID "9680177120"
    const existingPA = await db.user.findUnique({
      where: { email: 'rajulalkumawat1995@gmail.com' },
    })

    if (!existingPA) {
      const paPassword = await hash('Kumawat@4321', 12)
      await db.user.create({
        data: {
          name: 'Er. Raju Kumawat',
          email: 'rajulalkumawat1995@gmail.com',
          password: paPassword,
          phone: '9680177120',
          role: 'platform_admin',
          organizationId: platformOrg.id, // Super admin linked to PLATFORM org
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      })
      console.log('Platform admin created with org: 9680177120')
    } else {
      await db.user.update({
        where: { id: existingPA.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          role: 'platform_admin',
          organizationId: platformOrg.id, // Ensure linked to PLATFORM org
        },
      })
    }

    // ── Create Teacher Organization ──
    // This is a DIFFERENT org with a DIFFERENT unique code — never same as super admin
    const teacherOrg = await db.organization.upsert({
      where: { code: '9680177120' },
      update: { name: 'Er. Raju Kumawat Tech', accentColor: '#D97706', status: 'active', adminCommission: 20, gatewayCharge: 2.36 },
      create: {
        name: 'Er. Raju Kumawat Tech',
        code: '9680177120',
        accentColor: '#D97706',
        status: 'active',
        adminCommission: 20,
        gatewayCharge: 2.36,
      },
    })

    // ── Create Demo Teacher ──
    const existingTeacher = await db.user.findUnique({
      where: { email: 'teacher@erraju.com' },
    })

    if (!existingTeacher) {
      const teacherPassword = await hash('teacher123', 12)
      await db.user.create({
        data: {
          name: 'Demo Teacher',
          email: 'teacher@erraju.com',
          password: teacherPassword,
          phone: '9680177120',
          role: 'teacher',
          organizationId: teacherOrg.id,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      })
    } else {
      await db.user.update({
        where: { id: existingTeacher.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          role: 'teacher',
          organizationId: teacherOrg.id,
        },
      })
    }

    // ── Seed demo categories ──
    const existingCategories = await db.category.count({
      where: { organizationId: teacherOrg.id },
    })

    if (existingCategories === 0) {
      await db.category.createMany({
        data: [
          { name: 'JEE', slug: 'jee', organizationId: teacherOrg.id, icon: '📐' },
          { name: 'NEET', slug: 'neet', organizationId: teacherOrg.id, icon: '🧬' },
          { name: 'UPSC', slug: 'upsc', organizationId: teacherOrg.id, icon: '🏛️' },
          { name: 'CAT', slug: 'cat', organizationId: teacherOrg.id, icon: '💼' },
          { name: 'GATE', slug: 'gate', organizationId: teacherOrg.id, icon: '⚙️' },
        ],
      })
    }

    // ── Seed demo test series ──
    const existingTestSeries = await db.testSeries.count({
      where: { organizationId: teacherOrg.id },
    })

    if (existingTestSeries === 0) {
      const ts1 = await db.testSeries.create({
        data: {
          title: 'JEE Main 2025 Complete Test Series',
          description: 'Comprehensive test series for JEE Main 2025 preparation with chapter-wise and full-length mock tests.',
          price: 299,
          mrp: 499,
          category: 'JEE',
          isCombo: true,
          status: 'published',
          sortOrder: 1,
          organizationId: teacherOrg.id,
        },
      })

      await db.test.createMany({
        data: [
          {
            title: 'JEE Main Mock Test 1 - Physics',
            status: 'free',
            numberOfQuestions: 30,
            totalMarks: 120,
            totalDuration: 60,
            testSeriesId: ts1.id,
            organizationId: teacherOrg.id,
          },
          {
            title: 'JEE Main Mock Test 2 - Chemistry',
            status: 'paid',
            numberOfQuestions: 30,
            totalMarks: 120,
            totalDuration: 60,
            testSeriesId: ts1.id,
            organizationId: teacherOrg.id,
          },
          {
            title: 'JEE Main Mock Test 3 - Mathematics',
            status: 'paid',
            numberOfQuestions: 30,
            totalMarks: 120,
            totalDuration: 60,
            testSeriesId: ts1.id,
            organizationId: teacherOrg.id,
          },
        ],
      })

      const ts2 = await db.testSeries.create({
        data: {
          title: 'NEET Biology Mastery Series',
          description: 'Master Biology for NEET with topic-wise practice tests and full mock tests.',
          price: 199,
          mrp: 399,
          category: 'NEET',
          isCombo: false,
          status: 'published',
          sortOrder: 2,
          organizationId: teacherOrg.id,
        },
      })

      await db.test.createMany({
        data: [
          {
            title: 'NEET Biology - Cell Biology',
            status: 'free',
            numberOfQuestions: 45,
            totalMarks: 180,
            totalDuration: 60,
            testSeriesId: ts2.id,
            organizationId: teacherOrg.id,
          },
          {
            title: 'NEET Biology - Genetics & Evolution',
            status: 'paid',
            numberOfQuestions: 45,
            totalMarks: 180,
            totalDuration: 60,
            testSeriesId: ts2.id,
            organizationId: teacherOrg.id,
          },
        ],
      })
    }

    // ── Seed demo courses ──
    const existingCourses = await db.course.count({
      where: { organizationId: teacherOrg.id },
    })

    if (existingCourses === 0) {
      await db.course.createMany({
        data: [
          {
            title: 'JEE Main Physics Complete Course',
            description: 'Master Physics for JEE Main with comprehensive video lectures, notes, and practice problems.',
            price: 1499,
            mrp: 2999,
            category: 'JEE',
            status: 'published',
            organizationId: teacherOrg.id,
          },
          {
            title: 'NEET Chemistry Crash Course',
            description: 'Quick revision course for NEET Chemistry covering all important topics with solved examples.',
            price: 799,
            mrp: 1599,
            category: 'NEET',
            status: 'published',
            organizationId: teacherOrg.id,
          },
          {
            title: 'UPSC GS Foundation Course',
            description: 'Build a strong foundation for UPSC Civil Services with our comprehensive General Studies course.',
            price: 2499,
            mrp: 4999,
            category: 'UPSC',
            status: 'published',
            organizationId: teacherOrg.id,
          },
        ],
      })
    }

    // ── Seed demo banners ──
    const existingBanners = await db.banner.count({
      where: { organizationId: teacherOrg.id },
    })

    if (existingBanners === 0) {
      await db.banner.createMany({
        data: [
          {
            title: 'Start Your Learning Journey',
            image: '/banners/learning-journey.svg',
            link: '/courses',
            sortOrder: 1,
            isActive: true,
            organizationId: teacherOrg.id,
          },
          {
            title: 'Ace Your Exams with Test Series',
            image: '/banners/test-series.svg',
            link: '/test-series',
            sortOrder: 2,
            isActive: true,
            organizationId: teacherOrg.id,
          },
        ],
      })
    }

    // ── Seed demo quick links ──
    const existingQuickLinks = await db.quickLink.count({
      where: { organizationId: teacherOrg.id },
    })

    if (existingQuickLinks === 0) {
      await db.quickLink.createMany({
        data: [
          {
            title: 'YouTube Channel',
            url: 'https://youtube.com',
            icon: 'youtube',
            sortOrder: 1,
            organizationId: teacherOrg.id,
          },
          {
            title: 'Telegram Group',
            url: 'https://telegram.org',
            icon: 'telegram',
            sortOrder: 2,
            organizationId: teacherOrg.id,
          },
          {
            title: 'WhatsApp Support',
            url: 'https://wa.me/919680177120',
            icon: 'whatsapp',
            sortOrder: 3,
            organizationId: teacherOrg.id,
          },
        ],
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Data seeded successfully!',
      credentials: {
        platformAdmin: {
          email: 'rajulalkumawat1995@gmail.com',
          password: 'Kumawat@4321',
          instituteId: '9680177120', // UNIQUE — different from teacher
          portal: 'Super Admin Portal (Teacher Management)',
        },
        teacher: {
          email: 'teacher@erraju.com',
          password: 'teacher123',
          instituteId: '9680177120', // UNIQUE — different from super admin
          portal: 'CMS Portal (Institute Management)',
        },
      },
      note: 'Institute IDs are always UNIQUE. Super admin and teacher NEVER share the same institute ID.',
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to seed data', error: String(error) },
      { status: 500 }
    )
  }
}
