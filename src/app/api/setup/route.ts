import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * GET /api/setup
 *
 * Auto-setup endpoint that:
 * 1. Runs prisma db push to create all tables (if needed)
 * 2. Checks if database is initialized
 * 3. If not, creates default organization, admin user, and demo data
 * 4. Returns setup status
 *
 * This runs automatically on first deployment.
 * Can be triggered manually via GET /api/setup
 */
export async function GET(req: NextRequest) {
  // ── SECURITY: Block in production without secret key ──────────────────────
  // To run setup in production: GET /api/setup?key=YOUR_SETUP_KEY
  if (process.env.NODE_ENV === 'production') {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    const expectedKey = process.env.SETUP_KEY || 'change-this-setup-key'
    if (key !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Provide ?key=SETUP_KEY to run setup in production.' },
        { status: 401 }
      )
    }
  }

  try {
    // Step 1: Ensure tables exist (run prisma db push)
    try {
      console.log('[SETUP] Ensuring database tables exist...')
      await execAsync('npx prisma db push', { 
        cwd: process.cwd(),
        timeout: 60000,
      })
      console.log('[SETUP] Database tables ready')
    } catch (e) {
      console.log('[SETUP] prisma db push failed (tables may already exist):', e instanceof Error ? e.message : e)
    }

    // Step 2: Import db after tables are created
    const { db } = await import('@/lib/db')

    // Check if database is already set up
    let orgCount = 0
    try {
      orgCount = await db.organization.count()
    } catch (e) {
      // Tables don't exist yet
      console.log('[SETUP] Tables not ready, please run: bun run db:push')
      return NextResponse.json({
        success: false,
        error: 'Database tables not found. Run: bun run db:push or bun run setup',
        instructions: 'See README.md for setup instructions',
      }, { status: 500 })
    }
    
    if (orgCount > 0) {
      const [userCount, studentCount, courseCount, testSeriesCount] = await Promise.all([
        db.user.count(),
        db.student.count(),
        db.course.count(),
        db.testSeries.count(),
      ])
      return NextResponse.json({
        success: true,
        message: 'Database already initialized',
        stats: {
          organizations: orgCount,
          users: userCount,
          students: studentCount,
          courses: courseCount,
          testSeries: testSeriesCount,
          status: 'ready',
        },
      })
    }

    // ── Database is empty, run auto-setup ──
    console.log('[SETUP] Database is empty, running auto-setup...')

    // 1. Create platform organization
    const platformOrg = await db.organization.create({
      data: {
        name: 'Er. Raju Kumawat Tech',
        code: '9680177120',
        accentColor: '#d97706',
        phone: '9680177120',
        status: 'active',
        adminCommission: 0,
        gatewayCharge: 2.36,
      },
    })
    console.log('[SETUP] Platform org created:', platformOrg.code)

    // 2. Create super admin
    const hashedAdminPassword = await hash('Kumawat@4321', 12)
    const superAdmin = await db.user.create({
      data: {
        email: 'rajulalkumawat1995@gmail.com',
        name: 'Er. Raju Kumawat',
        password: hashedAdminPassword,
        role: 'platform_admin',
        phone: '9680177120',
        organizationId: platformOrg.id,
      },
    })
    console.log('[SETUP] Super admin created:', superAdmin.email)

    // 3. Create teacher organizations
    const teacherOrgsData = [
      { name: 'Er. Raju Kumawat Academy', code: 'ERKTACADEMY', accentColor: '#10b981', phone: '9876543201', status: 'active' },
      { name: 'Delhi Public School', code: 'DPS2024', accentColor: '#7c3aed', phone: '9876543202', status: 'active' },
      { name: 'Modern Academy', code: 'MODA2024', accentColor: '#dc2626', phone: '9876543203', status: 'trial' },
      { name: 'Vision Classes', code: 'VISN2024', accentColor: '#0891b2', phone: '9876543204', status: 'active' },
      { name: 'Kumawat Study Point', code: 'KSP2024', accentColor: '#ea580c', phone: '9876543205', status: 'trial' },
    ]

    const teacherOrgs: any[] = []
    for (const orgData of teacherOrgsData) {
      const org = await db.organization.create({ data: orgData })
      teacherOrgs.push(org)
    }

    // 4. Create teacher users
    const hashedTeacherPassword = await hash('Kumawat@4321', 12)
    const teachersData = [
      { name: 'Ravi Sharma', email: 'ravi@errkt.com', phone: '9876543201', orgIndex: 0 },
      { name: 'Priya Patel', email: 'priya@dps.edu', phone: '9876543202', orgIndex: 1 },
      { name: 'Amit Kumar', email: 'amit@modernacademy.in', phone: '9876543203', orgIndex: 2 },
      { name: 'Sneha Gupta', email: 'sneha@visionclasses.com', phone: '9876543204', orgIndex: 3 },
      { name: 'Vikram Singh', email: 'vikram@kumawatstudy.com', phone: '9876543205', orgIndex: 4 },
    ]

    for (const t of teachersData) {
      await db.user.create({
        data: {
          email: t.email,
          name: t.name,
          password: hashedTeacherPassword,
          role: 'teacher',
          phone: t.phone,
          organizationId: teacherOrgs[t.orgIndex].id,
        },
      })
    }

    // 5. Create students for each org
    const studentNames = [
      'Rahul Verma', 'Sonia Singh', 'Aakash Gupta', 'Priya Sharma',
      'Rohit Mehta', 'Anjali Rao', 'Karan Malhotra', 'Divya Nair',
      'Arjun Reddy', 'Pooja Bhat', 'Siddharth Jain', 'Meera Kapoor',
      'Vivek Pandey', 'Anita Desai'
    ]

    let studentIndex = 0
    for (const org of teacherOrgs) {
      const studentsForOrg = studentIndex < 4 ? 4 : studentIndex < 7 ? 3 : 2
      for (let i = 0; i < studentsForOrg && studentIndex < studentNames.length; i++) {
        await db.student.create({
          data: {
            name: studentNames[studentIndex],
            email: `student${studentIndex + 1}@${org.code.toLowerCase()}.com`,
            phone: `98765${String(4000 + studentIndex).padStart(5, '0')}`,
            organizationId: org.id,
          },
        })
        studentIndex++
      }
    }

    // 6. Add content to each org
    for (const org of teacherOrgs) {
      // Courses
      const courses = [
        { title: 'Physics Complete Course', description: 'Complete physics course', price: 999, mrp: 1499, category: 'Physics', status: 'published' },
        { title: 'Chemistry Master Class', description: 'Master chemistry', price: 799, mrp: 1299, category: 'Chemistry', status: 'published' },
        { title: 'Mathematics Foundation', description: 'Build strong math foundation', price: 899, mrp: 1399, category: 'Mathematics', status: 'published' },
      ]
      for (const c of courses) {
        await db.course.create({ data: { ...c, organizationId: org.id } })
      }

      // Test Series
      const tsData = [
        { title: 'JEE Main Mock Test Series', description: 'Full-length mock tests', price: 499, mrp: 999, category: 'JEE', status: 'published' },
        { title: 'NEET Practice Tests', description: 'Practice tests for NEET', price: 399, mrp: 799, category: 'NEET', status: 'published' },
      ]
      for (const ts of tsData) {
        const created = await db.testSeries.create({ data: { ...ts, organizationId: org.id } })
        
        // Add tests with questions
        for (let t = 0; t < 2; t++) {
          const test = await db.test.create({
            data: {
              title: `Mock Test ${t + 1}`,
              numberOfQuestions: 5,
              totalMarks: 20,
              totalDuration: 60,
              status: t === 0 ? 'free' : 'paid',
              testSeriesId: created.id,
              organizationId: org.id,
            },
          })

          // Add sample questions
          const questions = [
            { title: 'What is the SI unit of force?', option1: 'Joule', option2: 'Newton', option3: 'Watt', option4: 'Pascal', correctOption: '2', positiveMarks: 4, negativeMarks: 1 },
            { title: 'Which is a vector quantity?', option1: 'Speed', option2: 'Mass', option3: 'Velocity', option4: 'Time', correctOption: '3', positiveMarks: 4, negativeMarks: 1 },
            { title: 'Acceleration due to gravity on Earth?', option1: '9.8 m/s²', option2: '8.9 m/s²', option3: '10.8 m/s²', option4: '9.5 m/s²', correctOption: '1', positiveMarks: 4, negativeMarks: 1 },
            { title: "Newton's third law states?", option1: 'Action-reaction', option2: 'F=ma', option3: 'Inertia', option4: 'Gravity', correctOption: '1', positiveMarks: 4, negativeMarks: 1 },
            { title: 'Formula for kinetic energy?', option1: 'E=mc²', option2: 'E=½mv²', option3: 'E=mgh', option4: 'E=Fd', correctOption: '2', positiveMarks: 4, negativeMarks: 1 },
          ]
          for (const q of questions) {
            await db.question.create({ data: { ...q, testId: test.id } })
          }
        }
      }

      // Digital products
      const dps = [
        { title: 'Physics Notes PDF', description: 'Comprehensive physics notes', price: 199, mrp: 399, type: 'notes', category: 'Physics', status: 'published' },
        { title: 'Chemistry Formula Sheet', description: 'All chemistry formulas', price: 99, mrp: 199, type: 'ebook', category: 'Chemistry', status: 'published' },
      ]
      for (const dp of dps) {
        await db.digitalProduct.create({ data: { ...dp, organizationId: org.id } })
      }

      // Blogs
      const blogs = [
        { title: 'Tips for Exam Preparation', content: 'Effective tips...', status: 'published' },
        { title: 'Time Management During Exams', content: 'Strategies...', status: 'published' },
      ]
      for (const b of blogs) {
        await db.blog.create({ data: { ...b, organizationId: org.id } })
      }

      // Coupons
      await db.coupon.create({ data: { code: `WELCOME${org.code.slice(0, 4)}`, discount: 20, discountType: 'percentage', maxUses: 100, isActive: true, organizationId: org.id } })
      await db.coupon.create({ data: { code: `SAVE${org.code.slice(0, 4)}`, discount: 50, discountType: 'flat', maxUses: 50, isActive: true, organizationId: org.id } })
    }

    // 7. Create platform notifications
    await db.notification.create({
      data: {
        title: 'Welcome to Er. Raju Kumawat Tech',
        message: 'Platform is ready. Start managing your teachers and content.',
        type: 'info',
        organizationId: platformOrg.id,
      },
    })

    console.log('[SETUP] Auto-setup complete!')

    return NextResponse.json({
      success: true,
      message: 'Database auto-setup complete!',
      stats: {
        organizations: await db.organization.count(),
        users: await db.user.count(),
        students: await db.student.count(),
        courses: await db.course.count(),
        testSeries: await db.testSeries.count(),
        tests: await db.test.count(),
        status: 'initialized',
      },
    })
  } catch (error) {
    console.error('[SETUP] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Setup failed' },
      { status: 500 }
    )
  }
}
