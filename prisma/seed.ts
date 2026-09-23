import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const db = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding database with rich live data for Admin, Teacher, and Student portals...')

  // ── Clean up existing data using sequential deletes ──
  console.log('🧹 Cleaning existing data...')
  const tables = [
    'VideoTranslation', 'LessonProgress', 'CourseLesson', 'CourseModule', 'CourseChat',
    'ReportedQuestion', 'ModuleAccessLog', 'TeacherModuleAccess',
    'TestAttempt', 'Question', 'DeviceSession',
    'Payment', 'PurchasedCourse', 'PurchasedTestSeries', 'Order',
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
      // ignore table missing or already clean
    }
  }
  console.log('✅ Cleaned existing data')

  // ═══════════════════════════════════════════════════════════════════════
  // 1. CREATE PLATFORM ORGANIZATION (Super Admin's own org)
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
  // 3. CREATE TEACHER ORGANIZATIONS
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
  // 4. CREATE TEACHER USERS
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
  // 5. CREATE CATEGORIES
  // ═══════════════════════════════════════════════════════════════════════
  const categoryDefs = [
    { name: 'JEE', slug: 'jee', icon: '🔬' },
    { name: 'NEET', slug: 'neet', icon: '🏥' },
    { name: 'CUET', slug: 'cuet', icon: '🎓' },
    { name: 'GATE', slug: 'gate', icon: '⚙️' },
    { name: 'UPSC', slug: 'upsc', icon: '🏛️' },
    { name: 'CAT', slug: 'cat', icon: '📊' },
  ]
  const categories: any[] = []
  for (const cat of categoryDefs) {
    const c = await db.category.create({
      data: { ...cat, organizationId: teacherOrgs[0].id },
    })
    categories.push(c)
  }
  console.log('✅ Categories created:', categories.length)

  // ═══════════════════════════════════════════════════════════════════════
  // 6. CREATE STUDENTS
  // ═══════════════════════════════════════════════════════════════════════
  const studentNames = [
    { name: 'Rahul Sharma', email: 'rahul@student.com', phone: '9988776601', orgIdx: 0 },
    { name: 'Priya Patel', email: 'priya.s@student.com', phone: '9988776602', orgIdx: 0 },
    { name: 'Amit Kumar', email: 'amit.s@student.com', phone: '9988776603', orgIdx: 0 },
    { name: 'Sneha Gupta', email: 'sneha.s@student.com', phone: '9988776604', orgIdx: 0 },
    { name: 'Vikram Singh', email: 'vikram.s@student.com', phone: '9988776605', orgIdx: 1 },
    { name: 'Ananya Reddy', email: 'ananya@student.com', phone: '9988776606', orgIdx: 1 },
    { name: 'Arjun Menon', email: 'arjun@student.com', phone: '9988776607', orgIdx: 1 },
    { name: 'Kavita Joshi', email: 'kavita@student.com', phone: '9988776608', orgIdx: 2 },
    { name: 'Rohit Verma', email: 'rohit.s@student.com', phone: '9988776609', orgIdx: 2 },
    { name: 'Meera Nair', email: 'meera@student.com', phone: '9988776610', orgIdx: 3 },
    { name: 'Sanjay Mishra', email: 'sanjay@student.com', phone: '9988776611', orgIdx: 3 },
    { name: 'Divya Sharma', email: 'divya@student.com', phone: '9988776612', orgIdx: 3 },
    { name: 'Rajesh Kumar', email: 'rajesh@student.com', phone: '9988776613', orgIdx: 4 },
    { name: 'Pooja Singh', email: 'pooja.s@student.com', phone: '9988776614', orgIdx: 4 },
  ]
  const students: any[] = []
  for (const s of studentNames) {
    // Create User record for student login first
    const studentUser = await db.user.create({
      data: {
        name: s.name,
        email: s.email,
        phone: s.phone,
        password: hashedAdminPassword,
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
  // 7. CREATE TEST SERIES
  // ═══════════════════════════════════════════════════════════════════════
  const testSeriesData = [
    { title: 'JEE Main 2025 Complete Masterclass', category: 'JEE', price: 999, mrp: 1999, isCombo: true, status: 'published', sortOrder: 1, description: 'Complete test series for JEE Main 2025 preparation with 25+ full-length tests and video explanations' },
    { title: 'NEET Biology Rapid Fire Pack', category: 'NEET', price: 499, mrp: 799, isCombo: false, status: 'published', sortOrder: 2, description: 'Biology focused high-yield test series for NEET aspirants' },
    { title: 'CUET General Aptitude 2025', category: 'CUET', price: 299, mrp: 499, isCombo: false, status: 'published', sortOrder: 3, description: 'General test preparation for CUET entrance exam' },
    { title: 'GATE Computer Science & IT Full Track', category: 'GATE', price: 1499, mrp: 2499, isCombo: true, status: 'published', sortOrder: 4, description: 'Computer Science GATE preparation with topic-wise and full mock tests' },
    { title: 'UPSC Civil Services GS Prelims', category: 'UPSC', price: 799, mrp: 1299, isCombo: false, status: 'published', sortOrder: 5, description: 'UPSC Civil Services Prelims test series with in-depth analysis' },
  ]
  const testSeriesList: any[] = []
  for (const ts of testSeriesData) {
    const item = await db.testSeries.create({
      data: { ...ts, organizationId: teacherOrgs[0].id, allowPayment: true, validityMode: 'lifetime' },
    })
    testSeriesList.push(item)
  }
  console.log('✅ Test Series created:', testSeriesList.length)

  // ═══════════════════════════════════════════════════════════════════════
  // 8. CREATE TESTS
  // ═══════════════════════════════════════════════════════════════════════
  const testsData = [
    { title: 'Mathematics Mid-Term Exam 2025', testSeriesId: testSeriesList[0].id, numberOfQuestions: 8, totalMarks: 32, totalDuration: 60, status: 'paid', isLive: true },
    { title: 'Physics Unit Test - Mechanics & Waves', testSeriesId: testSeriesList[0].id, numberOfQuestions: 10, totalMarks: 40, totalDuration: 45, status: 'free', isLive: true },
    { title: 'Chemistry - Organic Reactions & Mechanisms', testSeriesId: testSeriesList[0].id, numberOfQuestions: 10, totalMarks: 40, totalDuration: 45, status: 'paid', isLive: true },
    { title: 'Botany Fundamentals & Cell Biology', testSeriesId: testSeriesList[1].id, numberOfQuestions: 15, totalMarks: 60, totalDuration: 45, status: 'paid', isLive: true },
  ]
  const tests: any[] = []
  for (const t of testsData) {
    const item = await db.test.create({
      data: { ...t, organizationId: teacherOrgs[0].id, shuffleQuestions: true, shuffleOptions: true, allCompulsory: true, displayResults: true, displayRank: true, showSolution: true },
    })
    tests.push(item)
  }
  console.log('✅ Tests created:', tests.length)

  // ═══════════════════════════════════════════════════════════════════════
  // 9. CREATE QUESTIONS
  // ═══════════════════════════════════════════════════════════════════════
  let questionCount = 0;
  for (const test of tests) {
    const testQuestions = [
      { type: 'mcq', title: `Sample Question 1 for ${test.title}`, option1: 'Option A', option2: 'Option B', option3: 'Option C', option4: 'Option D', correctOption: '1', positiveMarks: 4, negativeMarks: 1, solutionText: 'Detailed solution for Q1' },
      { type: 'mcq', title: `Sample Question 2 for ${test.title}`, option1: 'Option A', option2: 'Option B', option3: 'Option C', option4: 'Option D', correctOption: '2', positiveMarks: 4, negativeMarks: 1, solutionText: 'Detailed solution for Q2' },
      { type: 'mcq', title: `Sample Question 3 for ${test.title}`, option1: 'Option A', option2: 'Option B', option3: 'Option C', option4: 'Option D', correctOption: '3', positiveMarks: 4, negativeMarks: 1, solutionText: 'Detailed solution for Q3' },
    ];
    for (let i = 0; i < testQuestions.length; i++) {
      await db.question.create({
        data: { ...testQuestions[i], testId: test.id, sortOrder: i + 1 },
      })
      questionCount++;
    }
  }
  console.log(`✅ ${questionCount} Questions created across ${tests.length} tests`)

  // ═══════════════════════════════════════════════════════════════════════
  // 10. CREATE COURSES, MODULES & LESSONS (LIVE VIDEO & PDF EMBEDS)
  // ═══════════════════════════════════════════════════════════════════════
  const coursesData = [
    { title: 'JEE Physics Complete Mastery 2025', category: 'JEE', price: 4999, mrp: 7999, status: 'published', description: 'Complete physics course for JEE Main & Advanced with live interactive demonstrations and concept notes.' },
    { title: 'NEET Biology 360 Full Score Batch', category: 'NEET', price: 3499, mrp: 5999, status: 'published', description: 'Comprehensive biology course covering Botany & Zoology with visual diagrams and NCERT line-by-line breakdown.' },
    { title: 'GATE Computer Science & Engineering 2025', category: 'GATE', price: 6999, mrp: 11999, status: 'published', description: 'Complete Computer Science course for GATE covering Data Structures, Algorithms, OS, DBMS and CN.' },
  ]

  for (const c of coursesData) {
    const course = await db.course.create({
      data: { ...c, organizationId: teacherOrgs[0].id },
    })

    // Module 1: Introduction & Foundation
    const mod1 = await db.courseModule.create({
      data: {
        title: 'Module 1: Core Fundamentals & Vectors',
        description: 'Foundational concepts, mathematical tools, and vector mechanics.',
        sortOrder: 1,
        courseId: course.id,
      },
    })

    // Lesson 1: Free Video
    const l1 = await db.courseLesson.create({
      data: {
        title: '01. Course Overview & Road to Success',
        type: 'video',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoDuration: 300,
        isFree: true,
        sortOrder: 1,
        moduleId: mod1.id,
        notes: 'Welcome to the course! Make sure to take notes in your physical notebook and review the formula sheet.',
      },
    })

    // Subtitle / translation for l1
    await db.videoTranslation.create({
      data: {
        lessonId: l1.id,
        languageCode: 'hi',
        languageName: 'Hindi',
        subtitleVttUrl: 'https://raw.githubusercontent.com/andruia/subtitles/main/sample-hi.vtt',
      },
    })

    // Lesson 2: Vector Mathematics
    await db.courseLesson.create({
      data: {
        title: '02. Vector Algebra & Coordinate Systems',
        type: 'video',
        videoUrl: 'https://www.youtube.com/watch?v=fNk_zzaMoSs',
        videoDuration: 640,
        isFree: false,
        sortOrder: 2,
        moduleId: mod1.id,
        notes: 'Covers dot product, cross product, right-hand thumb rule, and projection of vectors.',
      },
    })

    // Lesson 3: PDF Handout
    await db.courseLesson.create({
      data: {
        title: '03. Formula Sheet & High-Yield Summary (PDF)',
        type: 'pdf',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        isFree: true,
        sortOrder: 3,
        moduleId: mod1.id,
        content: 'Download and print this quick reference guide for vector identities.',
      },
    })

    // Module 2: Advanced Mechanics & Problem Solving
    const mod2 = await db.courseModule.create({
      data: {
        title: 'Module 2: Newton Laws of Motion & Friction',
        description: 'Free body diagrams, pseudo forces, friction coefficients, and pulley constraints.',
        sortOrder: 2,
        courseId: course.id,
      },
    })

    await db.courseLesson.create({
      data: {
        title: '04. Free Body Diagrams & Constraint Equations',
        type: 'video',
        videoUrl: 'https://www.youtube.com/watch?v=kKKM8Y-u7ds',
        videoDuration: 900,
        isFree: false,
        sortOrder: 1,
        moduleId: mod2.id,
      },
    })

    // Enroll the first 3 students in this course
    for (let sIdx = 0; sIdx < 3; sIdx++) {
      await db.purchasedCourse.create({
        data: {
          studentId: students[sIdx].id,
          courseId: course.id,
          organizationId: teacherOrgs[0].id,
        },
      })
    }
  }

  // Also enroll students in the first Test Series
  for (let sIdx = 0; sIdx < 3; sIdx++) {
    await db.purchasedTestSeries.create({
      data: {
        studentId: students[sIdx].id,
        testSeriesId: testSeriesList[0].id,
        organizationId: teacherOrgs[0].id,
      },
    })
  }
  console.log('✅ Courses, Modules, Lessons, Translations & Student Enrollments created')

  // ═══════════════════════════════════════════════════════════════════════
  // 11. CREATE DIGITAL PRODUCTS / NOTES
  // ═══════════════════════════════════════════════════════════════════════
  const digitalProducts = [
    { title: 'JEE Advanced Handwritten Notes 2025', price: 299, mrp: 599, status: 'published', category: 'JEE', type: 'notes', format: 'PDF', file: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { title: 'NEET Rapid Revision Mind Maps', price: 199, mrp: 399, status: 'published', category: 'NEET', type: 'notes', format: 'PDF', file: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { title: 'GATE CS Complete Formula Book', price: 349, mrp: 699, status: 'published', category: 'GATE', type: 'notes', format: 'PDF', file: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  ]
  for (const dp of digitalProducts) {
    await db.digitalProduct.create({
      data: { ...dp, organizationId: teacherOrgs[0].id },
    })
  }
  console.log('✅ Digital Products created:', digitalProducts.length)

  // ═══════════════════════════════════════════════════════════════════════
  // 12. CREATE TEST ATTEMPTS WITH LIVE RESULTS
  // ═══════════════════════════════════════════════════════════════════════
  const attempts = [
    { studentId: students[0].id, testId: tests[0].id, score: 28, totalMarks: 32, rank: 1, percentile: 98.5, timeTaken: 1450, status: 'completed' },
    { studentId: students[1].id, testId: tests[0].id, score: 24, totalMarks: 32, rank: 2, percentile: 85.0, timeTaken: 1620, status: 'completed' },
    { studentId: students[2].id, testId: tests[0].id, score: 20, totalMarks: 32, rank: 3, percentile: 72.0, timeTaken: 1800, status: 'completed' },
  ]
  for (const att of attempts) {
    await db.testAttempt.create({
      data: {
        ...att,
        answers: JSON.stringify({ '1': '1', '2': '2', '3': '3', '4': '2', '5': '2' }),
      },
    })
  }
  console.log('✅ Test Attempts created:', attempts.length)

  // ═══════════════════════════════════════════════════════════════════════
  // 13. CREATE BLOGS, BANNERS, COUPONS, LEADS, SUPPORT QUERIES & QUICK LINKS
  // ═══════════════════════════════════════════════════════════════════════
  for (const targetOrgId of [platformOrg.id, teacherOrgs[0].id]) {
    await db.blog.create({ data: { title: 'Tips for JEE Main 2025 Preparation', status: 'published', content: 'Comprehensive guide for JEE preparation including study plans, important topics, and time management strategies.', organizationId: targetOrgId } })
    await db.blog.create({ data: { title: 'NEET 2025: Subject-wise Strategy', status: 'published', content: 'Detailed strategy for each subject in NEET - Physics, Chemistry, and Biology with focus areas and preparation tips.', organizationId: targetOrgId } })

    await db.banner.create({ data: { title: 'JEE Main 2025 - Early Bird 50% Off', image: '/banners/jee-2024.jpg', link: '/test-series', sortOrder: 1, isActive: true, organizationId: targetOrgId } })
    await db.banner.create({ data: { title: 'NEET Biology Mastery Live Batch', image: '/banners/neet-biology.jpg', link: '/courses', sortOrder: 2, isActive: true, organizationId: targetOrgId } })

    await db.coupon.create({ data: { code: targetOrgId === platformOrg.id ? 'PLATFORM50' : 'SUMMER2025', discount: 20, discountType: 'percentage', maxUses: 100, isActive: true, organizationId: targetOrgId } })
    await db.coupon.create({ data: { code: targetOrgId === platformOrg.id ? 'WELCOME100' : 'FIRST50', discount: 50, discountType: 'flat', maxUses: 50, isActive: true, organizationId: targetOrgId } })

    await db.lead.create({ data: { name: 'Ravi Kumar', email: 'ravi@gmail.com', phone: '9876543201', source: 'Website', status: 'new', organizationId: targetOrgId } })
    await db.lead.create({ data: { name: 'Pooja Sharma', email: 'pooja@gmail.com', phone: '9876543202', source: 'Instagram', status: 'contacted', organizationId: targetOrgId } })

    await db.supportQuery.create({ data: { subject: 'Cannot access live doubt solver', message: 'I purchased the JEE Physics course but need help accessing the live community.', status: 'open', studentName: 'Rahul Sharma', studentEmail: 'rahul@student.com', organizationId: targetOrgId } })
    await db.supportQuery.create({ data: { subject: 'Payment invoice receipt', message: 'Please provide official GST invoice for institute reimbursement.', status: 'resolved', studentName: 'Priya Patel', studentEmail: 'priya.s@student.com', organizationId: targetOrgId } })

    await db.quickLink.create({ data: { title: 'JEE Main Official Portal', url: 'https://jeemain.nta.nic.in', icon: '🔗', sortOrder: 1, organizationId: targetOrgId } })
    await db.quickLink.create({ data: { title: 'NEET Official Portal', url: 'https://neet.nta.nic.in', icon: '🏥', sortOrder: 2, organizationId: targetOrgId } })
  }

  await db.notification.create({ data: { title: 'New Teacher Registered', message: 'Vikram Singh registered with Kumawat Study Point', type: 'info', organizationId: platformOrg.id } })
  await db.notification.create({ data: { title: 'Payment Settlement Received', message: '₹24,500 monthly payout processed for Er. Raju Kumawat Academy', type: 'success', organizationId: platformOrg.id } })

  console.log('\n🎉 Seeding complete with 100% database synchronization!')
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
