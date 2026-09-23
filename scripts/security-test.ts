export {}

/**
 * Security Test Suite
 * Run with: bunx tsx scripts/security-test.ts
 */
const BASE_URL = 'http://localhost:3000'
const results: { test: string; status: 'PASS' | 'FAIL'; detail: string }[] = []

async function test(name: string, fn: () => Promise<boolean>) {
  try {
    const passed = await fn()
    results.push({ test: name, status: passed ? 'PASS' : 'FAIL', detail: '' })
    console.log(`${passed ? '✅' : '❌'} ${name}`)
  } catch (e: any) {
    results.push({ test: name, status: 'FAIL', detail: e.message })
    console.log(`❌ ${name}: ${e.message}`)
  }
}

async function main() {
  console.log('\n🔒 Security Test Suite\n=====================================\n')

  // 1. SQL Injection
  console.log('📋 1. SQL Injection Tests\n')
  await test('SQL injection in login', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/direct-login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: "admin' OR '1'='1", password: 'x', orgId: '9680177120' })
    })
    return !(await res.json()).success
  })
  await test('SQL injection in org code', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/direct-login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'x', orgId: "9680177120' OR '1'='1" })
    })
    return !(await res.json()).success
  })

  // 2. XSS
  console.log('\n📋 2. XSS Tests\n')
  await test('XSS in email field', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/direct-login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '<script>alert(1)</script>@test.com', password: 'x', orgId: '9680177120' })
    })
    return !(await res.json()).success
  })

  // 3. Auth Bypass
  console.log('\n📋 3. Authentication Bypass Tests\n')
  await test('Admin dashboard without auth', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`)
    return res.status === 401
  })
  await test('Teacher dashboard without auth', async () => {
    const res = await fetch(`${BASE_URL}/api/teacher/dashboard`)
    return res.status === 401
  })
  await test('Forged JWT rejected', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`, { headers: { 'x-auth-token': 'fake.jwt.token' } })
    return res.status === 401
  })

  // 4. Authorization
  console.log('\n📋 4. Authorization Tests\n')
  const teacherLogin = await fetch(`${BASE_URL}/api/auth/direct-login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ravi@errkt.com', password: 'Kumawat@4321', orgId: 'ERKTACADEMY' })
  })
  const teacherToken = (await teacherLogin.json()).apiToken

  await test('Teacher cannot access admin API', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`, { headers: { 'x-auth-token': teacherToken } })
    return res.status === 403
  })
  await test('Teacher cannot create teachers', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/create-teacher`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-auth-token': teacherToken },
      body: JSON.stringify({ name: 'H', email: 'h@t.com', password: 'Test1234!', platformId: 'HACK' })
    })
    return res.status === 403
  })

  // 5. Cross-Org Access
  console.log('\n📋 5. Cross-Organization Access Tests\n')
  await test('Teacher cannot access other org', async () => {
    const res = await fetch(`${BASE_URL}/api/dashboard?organizationId=DPS2024`, { headers: { 'x-auth-token': teacherToken } })
    return res.status === 403
  })

  // 6. Input Validation
  console.log('\n📋 6. Input Validation Tests\n')
  await test('Empty fields rejected', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/direct-login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '', orgId: '' })
    })
    return !(await res.json()).success
  })
  await test('Wrong password rejected', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/direct-login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ravi@errkt.com', password: 'wrong', orgId: 'ERKTACADEMY' })
    })
    return !(await res.json()).success
  })

  // 7. Public APIs
  console.log('\n📋 7. Public API Tests\n')
  await test('Public portal data works', async () => {
    const res = await fetch(`${BASE_URL}/api/public/portal-data?orgCode=ERKTACADEMY`)
    return (await res.json()).success === true
  })
  await test('Public manifest works', async () => {
    const res = await fetch(`${BASE_URL}/api/public/manifest?orgCode=ERKTACADEMY`)
    return (await res.json()).name !== undefined
  })

  // Summary
  console.log('\n=====================================\n📊 SUMMARY\n=====================================')
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  console.log(`Total: ${results.length} | Passed: ${passed} ✅ | Failed: ${failed} ❌ | Rate: ${((passed / results.length) * 100).toFixed(1)}%`)
  if (failed > 0) {
    console.log('\nFailed:')
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ❌ ${r.test}: ${r.detail}`))
  }
  console.log('')
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(console.error)
