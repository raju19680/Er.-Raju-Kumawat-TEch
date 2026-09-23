import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const db = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding database...')

  // ── Clean up existing data using raw SQL (respects FK order) ──
  console.log('🧹 Cleaning existing data...')
  try {
    // Delete in dependency order using raw SQL for SQLite
    const tables = [
      'ReportedQuestion', 'ModuleAccessLog', 'TeacherModuleAccess',
      'TestAttempt', 'Question', 'DeviceSession',
      'Payment', 'PurchasedCourse', 'Order',
      'Test', 'Section', 'TestSeries', 'Course', 'DigitalProduct',
      'Student', 'Category', 'Blog', 'Banner', 'Coupon',
      'Notification', 'Announcement', 'FeatureFlag', 'PlatformSetting',
      'Lead', 'SupportQuery', 'QuickLink',
      'EmailLog', 'AuditLog', 'Payout', 'LoginAttempt',
      'User', 'Organization',
    ]
    for (const table of tables) {
      try {
        await db.$executeRawUnsafe(`DELETE FROM "${table}"`)
      } catch {
        // Table might not exist or be empty, ignore
      }
    }
    console.log('✅ Cleaned existing data')
  } catch {
    console.log('⚠️ Cleanup skipped (fresh DB)')
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 1. CREATE PLATFORM ORGANIZATION (Super Admin's own org)
  //    Institute ID: 9680177120
  // ═══════════════════════════════════════════════════════════════════════
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
  console.log('✅ Platform org created:', platformOrg.name, '| Code:', platformOrg.code)

  // ═══════════════════════════════════════════════════════════════════════
  // 2. CREATE SUPER ADMIN USER
  //    Email: rajulalkumawat1995@gmail.com
  //    Password: Kumawat@4321
  //    Role: platform_admin
  // ═══════════════════════════════════════════════════════════════════════
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
  console.log('✅ Super Admin created:', superAdmin.email, '| Role:', superAdmin.role)

  // ═══════════════════════════════════════════════════════════════════════
  // 3. CREATE TEACHER ORGANIZATIONS (each with UNIQUE Institute ID)
  // ═══════════════════════════════════════════════════════════════════════
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
    console.log('✅ Teacher org created:', org.name, '| Code:', org.code)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. CREATE TEACHER USERS (each linked to their own org)
  // ═══════════════════════════════════════════════════════════════════════
  const hashedTeacherPassword = await hash('Kumawat@4321', 12)
  const teachersData = [
    { name: 'Ravi Sharma', email: 'ravi@errkt.com', phone: '9876543201', orgIndex: 0 },
    { name: 'Priya Patel', email: 'priya@dps.edu', phone: '9876543202', orgIndex: 1 },
    { name: 'Amit Kumar', email: 'amit@modernacademy.in', phone: '9876543203', orgIndex: 2 },
    { name: 'Sneha Gupta', email: 'sneha@visionclasses.com', phone: '9876543204', orgIndex: 3 },
    { name: 'Vikram Singh', email: 'vikram@kumawatstudy.com', phone: '9876543205', orgIndex: 4 },
  ]

  const teacherUsers: any[] = []
  for (const t of teachersData) {
    const teacher = await db.user.create({
      data: {
        email: t.email,
        name: t.name,
        password: hashedTeacherPassword,
        role: 'teacher',
        phone: t.phone,
        organizationId: teacherOrgs[t.orgIndex].id,
      },
    })
    teacherUsers.push(teacher)
    console.log('✅ Teacher created:', teacher.name, '| Org Code:', teacherOrgs[t.orgIndex].code)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. CREATE CATEGORIES for first org (Er. Raju Kumawat Academy)
  // ═══════════════════════════════════════════════════════════════════════
  const categories = await Promise.all([
    db.category.create({ data: { name: 'JEE', slug: 'jee', icon: '🔬', organizationId: teacherOrgs[0].id } }),
    db.category.create({ data: { name: 'NEET', slug: 'neet', icon: '🏥', organizationId: teacherOrgs[0].id } }),
    db.category.create({ data: { name: 'CUET', slug: 'cuet', icon: '🎓', organizationId: teacherOrgs[0].id } }),
    db.category.create({ data: { name: 'GATE', slug: 'gate', icon: '⚙️', organizationId: teacherOrgs[0].id } }),
    db.category.create({ data: { name: 'UPSC', slug: 'upsc', icon: '🏛️', organizationId: teacherOrgs[0].id } }),
    db.category.create({ data: { name: 'CAT', slug: 'cat', icon: '📊', organizationId: teacherOrgs[0].id } }),
  ])
  console.log('✅ Categories created:', categories.length)

  // ═══════════════════════════════════════════════════════════════════════
  // 6. CREATE STUDENTS (spread across orgs)
  // ═══════════════════════════════════════════════════════════════════════
  const studentNames = [
    // Er. Raju Kumawat Academy students
    { name: 'Rahul Sharma', email: 'rahul@student.com', phone: '9988776601', orgIdx: 0 },
    { name: 'Priya Patel', email: 'priya.s@student.com', phone: '9988776602', orgIdx: 0 },
    { name: 'Amit Kumar', email: 'amit.s@student.com', phone: '9988776603', orgIdx: 0 },
    { name: 'Sneha Gupta', email: 'sneha.s@student.com', phone: '9988776604', orgIdx: 0 },
    // Delhi Public School students
    { name: 'Vikram Singh', email: 'vikram.s@student.com', phone: '9988776605', orgIdx: 1 },
    { name: 'Ananya Reddy', email: 'ananya@student.com', phone: '9988776606', orgIdx: 1 },
    { name: 'Arjun Menon', email: 'arjun@student.com', phone: '9988776607', orgIdx: 1 },
    // Modern Academy students
    { name: 'Kavita Joshi', email: 'kavita@student.com', phone: '9988776608', orgIdx: 2 },
    { name: 'Rohit Verma', email: 'rohit.s@student.com', phone: '9988776609', orgIdx: 2 },
    // Vision Classes students
    { name: 'Meera Nair', email: 'meera@student.com', phone: '9988776610', orgIdx: 3 },
    { name: 'Sanjay Mishra', email: 'sanjay@student.com', phone: '9988776611', orgIdx: 3 },
    { name: 'Divya Sharma', email: 'divya@student.com', phone: '9988776612', orgIdx: 3 },
    // Kumawat Study Point students
    { name: 'Rajesh Kumar', email: 'rajesh@student.com', phone: '9988776613', orgIdx: 4 },
    { name: 'Pooja Singh', email: 'pooja.s@student.com', phone: '9988776614', orgIdx: 4 },
  ]
  const hashedStudentPassword = await hash('Kumawat@4321', 12)
  const students: any[] = []
  for (const s of studentNames) {
    // Create User record for student login first
    const studentUser = await db.user.create({
      data: {
        name: s.name,
        email: s.email,
        phone: s.phone,
        password: hashedStudentPassword,
        role: 'student',
        organizationId: teacherOrgs[s.orgIdx].id,
      },
    })

    // Create Student record linked to User
    const student = await db.student.create({
      data: {
        name: s.name,
        email: s.email,
        phone: s.phone,
        organizationId: teacherOrgs[s.orgIdx].id,
        userId: studentUser.id,
      },
    })
    students.push(student)
  }
  console.log('✅ Students & Student Users created (linked via userId):', students.length)

  // ═══════════════════════════════════════════════════════════════════════
  // 7. CREATE TEST SERIES for Er. Raju Kumawat Academy
  // ═══════════════════════════════════════════════════════════════════════
  const testSeriesData = [
    { title: 'JEE Main 2024 Complete', category: 'JEE', price: 999, mrp: 1999, isCombo: true, status: 'published', sortOrder: 1, description: 'Complete test series for JEE Main 2024 preparation with 25+ full-length tests' },
    { title: 'NEET Biology Pack', category: 'NEET', price: 499, mrp: 799, isCombo: false, status: 'published', sortOrder: 2, description: 'Biology focused test series for NEET aspirants' },
    { title: 'CUET General Test', category: 'CUET', price: 299, mrp: 499, isCombo: false, status: 'published', sortOrder: 3, description: 'General test preparation for CUET entrance exam' },
    { title: 'GATE CS 2024', category: 'GATE', price: 1499, mrp: 2499, isCombo: true, status: 'published', sortOrder: 4, description: 'Computer Science GATE preparation with topic-wise and full tests' },
    { title: 'UPSC Prelims 2024', category: 'UPSC', price: 799, mrp: 1299, isCombo: false, status: 'draft', sortOrder: 5, description: 'UPSC Civil Services Prelims test series' },
    { title: 'CAT Mock Series', category: 'CAT', price: 599, mrp: 999, isCombo: false, status: 'published', sortOrder: 6, description: 'Full-length CAT mock test series with detailed solutions' },
  ]
  const testSeries = await Promise.all(
    testSeriesData.map((ts) =>
      db.testSeries.create({
        data: { ...ts, organizationId: teacherOrgs[0].id, allowPayment: true, validityMode: 'lifetime' },
      })
    )
  )
  console.log('✅ Test Series created:', testSeries.length)

  // ═══════════════════════════════════════════════════════════════════════
  // 8. CREATE TESTS
  // ═══════════════════════════════════════════════════════════════════════
  const testsData = [
    { title: 'Mathematics Mid-Term 2024', testSeriesId: testSeries[0].id, numberOfQuestions: 50, totalMarks: 200, totalDuration: 180, status: 'paid', isLive: true },
    { title: 'Physics Unit Test - Mechanics', testSeriesId: testSeries[0].id, numberOfQuestions: 30, totalMarks: 120, totalDuration: 90, status: 'free', isLive: true },
    { title: 'Chemistry - Organic Reactions', testSeriesId: testSeries[0].id, numberOfQuestions: 40, totalMarks: 160, totalDuration: 120, status: 'paid', isLive: true },
    { title: 'Botany Fundamentals', testSeriesId: testSeries[1].id, numberOfQuestions: 45, totalMarks: 180, totalDuration: 120, status: 'paid', isLive: true },
    { title: 'Zoology - Human Physiology', testSeriesId: testSeries[1].id, numberOfQuestions: 35, totalMarks: 140, totalDuration: 90, status: 'free', isLive: true },
    { title: 'General Knowledge', testSeriesId: testSeries[2].id, numberOfQuestions: 50, totalMarks: 200, totalDuration: 60, status: 'free', isLive: true },
    { title: 'Data Structures & Algorithms', testSeriesId: testSeries[3].id, numberOfQuestions: 65, totalMarks: 100, totalDuration: 180, status: 'paid', isLive: true },
    { title: 'Operating Systems', testSeriesId: testSeries[3].id, numberOfQuestions: 40, totalMarks: 100, totalDuration: 120, status: 'paid', isLive: false },
  ]
  const tests = await Promise.all(
    testsData.map((t) =>
      db.test.create({
        data: { ...t, organizationId: teacherOrgs[0].id, shuffleQuestions: true, shuffleOptions: true, allCompulsory: true, displayResults: true, displayRank: true, showSolution: true },
      })
    )
  )
  console.log('✅ Tests created:', tests.length)

  // ═══════════════════════════════════════════════════════════════════════
  // 9. CREATE QUESTIONS for first test
  // ═══════════════════════════════════════════════════════════════════════
  const questionsData = [
    { type: 'mcq', title: 'What is the derivative of sin(x)?', option1: 'cos(x)', option2: '-cos(x)', option3: 'sin(x)', option4: '-sin(x)', correctOption: '1', section: 'Calculus', positiveMarks: 4, negativeMarks: -1 },
    { type: 'mcq', title: 'The integral of 1/x dx is:', option1: 'x²/2', option2: 'ln|x| + C', option3: '1/x² + C', option4: 'x + C', correctOption: '2', section: 'Calculus', positiveMarks: 4, negativeMarks: -1 },
    { type: 'mcq', title: 'Which of the following is a prime number?', option1: '15', option2: '21', option3: '23', option4: '25', correctOption: '3', section: 'Number Theory', positiveMarks: 4, negativeMarks: -1 },
    { type: 'mcq', title: 'The value of lim(x→0) sin(x)/x is:', option1: '0', option2: '1', option3: '∞', option4: 'Undefined', correctOption: '2', section: 'Limits', positiveMarks: 4, negativeMarks: -1 },
    { type: 'mcq', title: 'The determinant of a 2×2 identity matrix is:', option1: '0', option2: '1', option3: '2', option4: '4', correctOption: '2', section: 'Linear Algebra', positiveMarks: 4, negativeMarks: -1 },
    { type: 'numerical', title: 'Find the value of 2^10:', section: 'Number Theory', positiveMarks: 4, negativeMarks: 0, correctOption: '1024' },
    { type: 'true_false', title: 'The square root of 2 is a rational number.', option1: 'True', option2: 'False', correctOption: '2', section: 'Number Theory', positiveMarks: 2, negativeMarks: 0 },
    { type: 'mcq', title: 'The Laplace transform of e^(at) is:', option1: '1/(s-a)', option2: '1/(s+a)', option3: 's/(s-a)', option4: '(s-a)/s', correctOption: '1', section: 'Differential Equations', positiveMarks: 4, negativeMarks: -1 },
  ]
  const questions = await Promise.all(
    questionsData.map((q, i) =>
      db.question.create({
        data: { ...q, testId: tests[0].id, sortOrder: i + 1 },
      })
    )
  )
  console.log('✅ Questions created:', questions.length)

  // ═══════════════════════════════════════════════════════════════════════
  // 10. CREATE COURSES for Er. Raju Kumawat Academy
  // ═══════════════════════════════════════════════════════════════════════
  const coursesData = [
    { title: 'JEE Physics Complete', category: 'JEE', price: 4999, mrp: 7999, status: 'published', description: 'Complete physics course for JEE Main & Advanced' },
    { title: 'NEET Biology Mastery', category: 'NEET', price: 3499, mrp: 5999, status: 'published', description: 'Comprehensive biology course for NEET preparation' },
    { title: 'CUET English', category: 'CUET', price: 1999, mrp: 3499, status: 'published', description: 'English language preparation for CUET' },
    { title: 'GATE CS Full Course', category: 'GATE', price: 6999, mrp: 11999, status: 'published', description: 'Complete Computer Science course for GATE' },
    { title: 'UPSC GS Foundation', category: 'UPSC', price: 8999, mrp: 14999, status: 'draft', description: 'General Studies foundation course for UPSC' },
    { title: 'CAT Quant Prep', category: 'CAT', price: 2999, mrp: 4999, status: 'published', description: 'Quantitative aptitude preparation for CAT' },
  ]
  const courses = await Promise.all(
    coursesData.map((c) =>
      db.course.create({
        data: { ...c, organizationId: teacherOrgs[0].id },
      })
    )
  )
  console.log('✅ Courses created:', courses.length)

  // ═══════════════════════════════════════════════════════════════════════
  // 11. CREATE BLOGS, BANNERS, COUPONS, ETC for Er. Raju Kumawat Academy
  // ═══════════════════════════════════════════════════════════════════════
  const blogs = await Promise.all([
    db.blog.create({ data: { title: 'Tips for JEE Main 2024 Preparation', status: 'published', content: 'Comprehensive guide for JEE preparation including study plans, important topics, and time management strategies.', organizationId: teacherOrgs[0].id } }),
    db.blog.create({ data: { title: 'NEET 2024: Subject-wise Strategy', status: 'published', content: 'Detailed strategy for each subject in NEET - Physics, Chemistry, and Biology with focus areas and preparation tips.', organizationId: teacherOrgs[0].id } }),
    db.blog.create({ data: { title: 'How to Manage Time During Exams', status: 'published', content: 'Time management techniques for competitive exams including the Pomodoro method, priority scheduling, and practice strategies.', organizationId: teacherOrgs[0].id } }),
    db.blog.create({ data: { title: 'Understanding GATE Exam Pattern', status: 'draft', content: 'Complete breakdown of the GATE exam pattern, marking scheme, and preparation roadmap.', organizationId: teacherOrgs[0].id } }),
  ])
  console.log('✅ Blogs created:', blogs.length)

  const banners = await Promise.all([
    db.banner.create({ data: { title: 'JEE Main 2024 - Early Bird Offer', image: '/banners/jee-2024.jpg', link: '/test-series/jee-main-2024', sortOrder: 1, isActive: true, organizationId: teacherOrgs[0].id } }),
    db.banner.create({ data: { title: 'NEET Biology Pack - 40% Off', image: '/banners/neet-biology.jpg', link: '/test-series/neet-biology', sortOrder: 2, isActive: true, organizationId: teacherOrgs[0].id } }),
    db.banner.create({ data: { title: 'Free Demo Tests Available', image: '/banners/free-demo.jpg', link: '/tests/free', sortOrder: 3, isActive: true, organizationId: teacherOrgs[0].id } }),
  ])
  console.log('✅ Banners created:', banners.length)

  const coupons = await Promise.all([
    db.coupon.create({ data: { code: 'SUMMER2024', discount: 20, discountType: 'percentage', maxUses: 100, isActive: true, organizationId: teacherOrgs[0].id } }),
    db.coupon.create({ data: { code: 'FIRST50', discount: 50, discountType: 'flat', maxUses: 50, isActive: true, organizationId: teacherOrgs[0].id } }),
    db.coupon.create({ data: { code: 'JEE2024', discount: 15, discountType: 'percentage', maxUses: 200, isActive: false, organizationId: teacherOrgs[0].id } }),
  ])
  console.log('✅ Coupons created:', coupons.length)

  const leads = await Promise.all([
    db.lead.create({ data: { name: 'Ravi Kumar', email: 'ravi@gmail.com', phone: '9876543201', source: 'Website', status: 'new', organizationId: teacherOrgs[0].id } }),
    db.lead.create({ data: { name: 'Pooja Sharma', email: 'pooja@gmail.com', phone: '9876543202', source: 'Instagram', status: 'contacted', organizationId: teacherOrgs[0].id } }),
    db.lead.create({ data: { name: 'Suresh Reddy', email: 'suresh@gmail.com', phone: '9876543203', source: 'WhatsApp', status: 'qualified', organizationId: teacherOrgs[0].id } }),
    db.lead.create({ data: { name: 'Neha Singh', email: 'neha@gmail.com', source: 'Facebook', status: 'new', organizationId: teacherOrgs[0].id } }),
  ])
  console.log('✅ Leads created:', leads.length)

  const queries = await Promise.all([
    db.supportQuery.create({ data: { subject: 'Cannot access test series', message: 'I purchased the JEE Main 2024 test series but cannot access it.', status: 'open', studentName: 'Rahul Sharma', studentEmail: 'rahul@student.com', organizationId: teacherOrgs[0].id } }),
    db.supportQuery.create({ data: { subject: 'Payment not reflected', message: 'I made a payment for NEET Biology Pack but it still shows as unpaid.', status: 'in_progress', studentName: 'Priya Patel', studentEmail: 'priya.s@student.com', organizationId: teacherOrgs[0].id } }),
    db.supportQuery.create({ data: { subject: 'Question error in Math test', message: 'Question 15 in Mathematics Mid-Term has wrong answer key.', status: 'resolved', studentName: 'Amit Kumar', studentEmail: 'amit.s@student.com', organizationId: teacherOrgs[0].id } }),
    db.supportQuery.create({ data: { subject: 'Request for refund', message: 'I want a refund for the GATE CS course as I am not satisfied.', status: 'open', studentName: 'Sneha Gupta', studentEmail: 'sneha.s@student.com', organizationId: teacherOrgs[0].id } }),
  ])
  console.log('✅ Support queries created:', queries.length)

  const quickLinks = await Promise.all([
    db.quickLink.create({ data: { title: 'JEE Main Official', url: 'https://jeemain.nta.nic.in', icon: '🔗', sortOrder: 1, organizationId: teacherOrgs[0].id } }),
    db.quickLink.create({ data: { title: 'NEET Official', url: 'https://neet.nta.nic.in', icon: '🏥', sortOrder: 2, organizationId: teacherOrgs[0].id } }),
    db.quickLink.create({ data: { title: 'NCERT Books', url: 'https://ncert.nic.in', icon: '📚', sortOrder: 3, organizationId: teacherOrgs[0].id } }),
    db.quickLink.create({ data: { title: 'Previous Year Papers', url: '/papers', icon: '📄', sortOrder: 4, organizationId: teacherOrgs[0].id } }),
  ])
  console.log('✅ Quick Links created:', quickLinks.length)

  // ═══════════════════════════════════════════════════════════════════════
  // 12. CREATE NOTIFICATIONS for platform
  // ═══════════════════════════════════════════════════════════════════════
  const notifications = await Promise.all([
    db.notification.create({ data: { title: 'New Teacher Registered', message: 'Vikram Singh has registered with Kumawat Study Point', type: 'info', organizationId: platformOrg.id } }),
    db.notification.create({ data: { title: 'Payment Received', message: '₹12,500 commission received from Delhi Public School', type: 'success', organizationId: platformOrg.id } }),
    db.notification.create({ data: { title: 'Trial Expiring', message: 'Modern Academy trial expires in 3 days', type: 'warning', organizationId: platformOrg.id } }),
  ])
  console.log('✅ Notifications created:', notifications.length)

  // ═══════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n🎉 Seeding complete!')
  console.log('\n📋 LOGIN CREDENTIALS:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👤 SUPER ADMIN (Admin Portal):')
  console.log('   Institute ID: 9680177120')
  console.log('   Email: rajulalkumawat1995@gmail.com')
  console.log('   Password: Kumawat@4321')
  console.log('   → Redirects to: Admin Portal (Teacher Management)')
  console.log('')
  console.log('👨‍🏫 TEACHER (CMS Portal):')
  console.log('   Institute ID: ERKTACADEMY')
  console.log('   Email: ravi@errkt.com')
  console.log('   Password: Kumawat@4321')
  console.log('   → Redirects to: CMS Portal (Institute Management)')
  console.log('')
  console.log('')
  console.log('🎓 STUDENT (Student Portal):')
  console.log('   Institute ID: ERKTACADEMY')
  console.log('   Email: rahul@student.com')
  console.log('   Password: Kumawat@4321')
  console.log('   → Redirects to: Student Portal')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
