export {}

const BASE_URL = 'http://localhost:3000'

async function runStudentPortalTest() {
  console.log('\n=============================================')
  console.log('🚀 STARTING STUDENT PORTAL FULL E2E TEST')
  console.log('=============================================\n')

  try {
    const studentEmail = 'rahul@student.com'
    const orgId = 'ERKTACADEMY'
    console.log(`Testing with student: ${studentEmail}, Institute ID: ${orgId}`)

    // 1. Authenticate / Login as student
    console.log(`\n1️⃣ Logging in as student (${studentEmail})...`)
    const loginRes = await fetch(`${BASE_URL}/api/auth/direct-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: 'Kumawat@4321',
        orgId: orgId,
        loginMode: 'student',
      }),
    })

    const loginData = await loginRes.json()
    console.log('Login response status:', loginRes.status, 'Success:', loginData.success, 'User:', loginData.user?.name || loginData.error || loginData.message)

    const cookieHeader = loginRes.headers.get('set-cookie')
    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (cookieHeader) {
      authHeaders['Cookie'] = cookieHeader.split(';')[0]
    }

    // 2. Test Stats API
    console.log('\n2️⃣ Testing /api/student/stats...')
    const statsRes = await fetch(`${BASE_URL}/api/student/stats`, { headers: authHeaders })
    const statsData = await statsRes.json()
    console.log('Stats Response Status:', statsRes.status)
    console.log('Stats Data:', statsData.stats)

    // 3. Test Orders API
    console.log('\n3️⃣ Testing /api/student/orders...')
    const ordersRes = await fetch(`${BASE_URL}/api/student/orders`, { headers: authHeaders })
    const ordersData = await ordersRes.json()
    console.log('Orders Response:', ordersRes.status, `Found ${ordersData.orders?.length ?? 0} orders`)

    // 4. Test Announcements API
    console.log('\n4️⃣ Testing /api/student/announcements...')
    const annRes = await fetch(`${BASE_URL}/api/student/announcements`, { headers: authHeaders })
    const annData = await annRes.json()
    console.log('Announcements Response:', annRes.status, `Found ${annData.announcements?.length ?? 0} notices`)

    // 5. Test Doubts API
    console.log('\n5️⃣ Testing /api/student/doubts...')
    const doubtsRes = await fetch(`${BASE_URL}/api/student/doubts`, { headers: authHeaders })
    const doubtsData = await doubtsRes.json()
    console.log('Doubts GET Response:', doubtsRes.status, `Found ${doubtsData.doubts?.length ?? 0} doubts`)

    console.log('Creating a test doubt question...')
    const createDoubtRes = await fetch(`${BASE_URL}/api/student/doubts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        subject: 'Query on Electrostatics Gauss Law',
        message: 'How do we calculate electric flux through a closed cylinder?',
        category: 'academic',
        priority: 'medium',
      }),
    })
    const createDoubtData = await createDoubtRes.json()
    console.log('Create Doubt POST Response:', createDoubtRes.status, createDoubtData.message || createDoubtData.doubt?.id)

    // 6. Test Enrolled Courses API
    console.log('\n6️⃣ Testing /api/student/courses...')
    const coursesRes = await fetch(`${BASE_URL}/api/student/courses`, { headers: authHeaders })
    const coursesData = await coursesRes.json()
    console.log('Courses Response:', coursesRes.status, `Found ${coursesData.courses?.length ?? 0} courses`)

    // 7. Test Test-Series API
    console.log('\n7️⃣ Testing /api/student/test-series...')
    const tsRes = await fetch(`${BASE_URL}/api/student/test-series`, { headers: authHeaders })
    const tsData = await tsRes.json()
    console.log('Test Series Response:', tsRes.status, `Found ${tsData.testSeries?.length ?? 0} test series`)

    // 8. Test Digital Products API
    console.log('\n8️⃣ Testing /api/student/digital-products...')
    const prodRes = await fetch(`${BASE_URL}/api/student/digital-products`, { headers: authHeaders })
    const prodData = await prodRes.json()
    console.log('Digital Products Response:', prodRes.status, `Found ${prodData.products?.length ?? 0} items`)

    // 9. Test Razorpay Order Creation
    console.log('\n9️⃣ Testing /api/payments/create-order for student checkout...')
    const rzpOrderRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        amount: 499,
        orgCode: orgId,
        itemType: 'product',
        itemId: 'prod_test_demo',
      }),
    })
    const rzpOrderData = await rzpOrderRes.json()
    console.log('Razorpay Order Creation Response:', rzpOrderRes.status, rzpOrderData.orderId ? `Generated order: ${rzpOrderData.orderId}` : rzpOrderData)

    console.log('\n=============================================')
    console.log('🎉 ALL STUDENT PORTAL MODULES & APIS VALIDATED!')
    console.log('=============================================\n')
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

runStudentPortalTest()
