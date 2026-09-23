import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks ───────────────────────────────────────────────────────────────────
// These mocks MUST be declared before importing the module under test, because
// Vitest hoists `vi.mock` calls to the top of the file anyway, but keeping the
// imports below the mocks keeps the intent clear.

// Track the auth state the mocked getAuthUser should return for the current test.
let mockAuthUser: Awaited<ReturnType<typeof getAuthUserRef>> = null
// Track what db.teacherModuleAccess.findUnique should return.
// Keyed by the moduleKey argument — different lookup responses for parent vs
// sub-feature can be configured by mapping the exact moduleKey string.
let mockFindUniqueImpl:
  | ((args: { where: { teacherId_moduleKey: { teacherId: string; moduleKey: string } } }) =>
        { enabled: boolean } | null)
  | null = null

// Reference to the mocked getAuthUser so tests can type the mock auth state.
type AuthUser = {
  id: string
  email: string
  name: string
  role: string
  orgId: string
  orgCode: string
  orgName: string
  orgAccent: string
  loginMode: string
}
const getAuthUserRef = async (_req?: NextRequest | Request): Promise<AuthUser | null> =>
  mockAuthUser

vi.mock('@/lib/auth-helpers', () => ({
  getAuthUser: (req?: NextRequest | Request) => getAuthUserRef(req),
}))

vi.mock('@/lib/db', () => ({
  db: {
    teacherModuleAccess: {
      findUnique: vi.fn((args: { where: { teacherId_moduleKey: { teacherId: string; moduleKey: string } } }) => {
        if (mockFindUniqueImpl) return mockFindUniqueImpl(args)
        return null
      }),
    },
  },
}))

// ── Import the module under test AFTER mocks are set up ─────────────────────
import { checkModuleAccess } from '@/lib/module-guard'
import { db } from '@/lib/db'

// Helper: build a fake NextRequest — module-guard only forwards it to the
// (mocked) getAuthUser, so the URL/headers content is not strictly meaningful.
function makeReq(): NextRequest {
  return new NextRequest('http://localhost/api/test')
}

const TEACHER = {
  id: 'teacher-123',
  email: 'teacher@example.com',
  name: 'Test Teacher',
  role: 'teacher',
  orgId: 'org-1',
  orgCode: 'ORG1',
  orgName: 'Org One',
  orgAccent: 'blue',
  loginMode: 'credentials',
}

const ADMIN = {
  ...TEACHER,
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'platform_admin',
}

const STUDENT = {
  ...TEACHER,
  id: 'student-1',
  email: 'student@example.com',
  name: 'Student User',
  role: 'student',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthUser = null
  mockFindUniqueImpl = null
})

describe('checkModuleAccess — authentication states', () => {
  it('returns 401 when there is no auth user', async () => {
    mockAuthUser = null
    const result = await checkModuleAccess(makeReq(), 'courses')
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.status).toBe(401)
      expect(result.error).toMatch(/authentication/i)
    }
    // DB should not be queried when auth fails
    expect(db.teacherModuleAccess.findUnique).not.toHaveBeenCalled()
  })

  it('allows platform_admin unconditionally (no DB call)', async () => {
    mockAuthUser = ADMIN
    const result = await checkModuleAccess(makeReq(), 'courses')
    expect(result.allowed).toBe(true)
    if (result.allowed) {
      expect(result.teacherId).toBe(ADMIN.id)
    }
    expect(db.teacherModuleAccess.findUnique).not.toHaveBeenCalled()
  })

  it('allows platform_admin even for sub-feature keys', async () => {
    mockAuthUser = ADMIN
    const result = await checkModuleAccess(makeReq(), 'courses.create')
    expect(result.allowed).toBe(true)
    expect(db.teacherModuleAccess.findUnique).not.toHaveBeenCalled()
  })

  it('allows non-teacher roles (e.g. student) unconditionally', async () => {
    mockAuthUser = STUDENT
    const result = await checkModuleAccess(makeReq(), 'courses')
    expect(result.allowed).toBe(true)
    if (result.allowed) {
      expect(result.teacherId).toBe(STUDENT.id)
    }
    expect(db.teacherModuleAccess.findUnique).not.toHaveBeenCalled()
  })

  it('allows non-teacher roles even for sub-feature keys', async () => {
    mockAuthUser = STUDENT
    const result = await checkModuleAccess(makeReq(), 'test-series.create')
    expect(result.allowed).toBe(true)
    expect(db.teacherModuleAccess.findUnique).not.toHaveBeenCalled()
  })
})

describe('checkModuleAccess — teacher parent-module access', () => {
  it('allows when parent module record exists and is enabled', async () => {
    mockAuthUser = TEACHER
    mockFindUniqueImpl = () => ({ enabled: true })
    const result = await checkModuleAccess(makeReq(), 'courses')
    expect(result.allowed).toBe(true)
    if (result.allowed) {
      expect(result.teacherId).toBe(TEACHER.id)
    }
    expect(db.teacherModuleAccess.findUnique).toHaveBeenCalledTimes(1)
  })

  it('denies with 403 when parent module record exists and is disabled', async () => {
    mockAuthUser = TEACHER
    mockFindUniqueImpl = () => ({ enabled: false })
    const result = await checkModuleAccess(makeReq(), 'courses')
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.status).toBe(403)
      expect(result.error).toContain('courses')
    }
    expect(db.teacherModuleAccess.findUnique).toHaveBeenCalledTimes(1)
  })

  it('allows (default) when no parent access record exists', async () => {
    mockAuthUser = TEACHER
    mockFindUniqueImpl = () => null
    const result = await checkModuleAccess(makeReq(), 'blogs')
    expect(result.allowed).toBe(true)
    if (result.allowed) {
      expect(result.teacherId).toBe(TEACHER.id)
    }
    expect(db.teacherModuleAccess.findUnique).toHaveBeenCalledTimes(1)
  })
})

describe('checkModuleAccess — teacher sub-feature access', () => {
  it('denies with 403 when parent enabled but sub-feature disabled', async () => {
    mockAuthUser = TEACHER
    // First call = parent 'courses' lookup (enabled), second call = sub 'courses.create' (disabled)
    let callCount = 0
    mockFindUniqueImpl = ({ where }) => {
      callCount++
      if (where.teacherId_moduleKey.moduleKey === 'courses') return { enabled: true }
      if (where.teacherId_moduleKey.moduleKey === 'courses.create') return { enabled: false }
      return null
    }
    const result = await checkModuleAccess(makeReq(), 'courses.create')
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.status).toBe(403)
      expect(result.error).toContain('courses.create')
    }
    expect(db.teacherModuleAccess.findUnique).toHaveBeenCalledTimes(2)
    // Sanity check: the function actually inspected both records
    expect(callCount).toBe(2)
  })

  it('allows when both parent and sub-feature are enabled', async () => {
    mockAuthUser = TEACHER
    mockFindUniqueImpl = () => ({ enabled: true })
    const result = await checkModuleAccess(makeReq(), 'courses.create')
    expect(result.allowed).toBe(true)
    if (result.allowed) {
      expect(result.teacherId).toBe(TEACHER.id)
    }
    expect(db.teacherModuleAccess.findUnique).toHaveBeenCalledTimes(2)
  })

  it('denies with 403 when parent is disabled (short-circuits before sub-feature lookup)', async () => {
    mockAuthUser = TEACHER
    mockFindUniqueImpl = ({ where }) => {
      // Should only be called for the parent key, never the sub-feature key
      expect(where.teacherId_moduleKey.moduleKey).toBe('courses')
      return { enabled: false }
    }
    const result = await checkModuleAccess(makeReq(), 'courses.create')
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.status).toBe(403)
      // Error message should reference the parent module, not the sub-feature
      expect(result.error).toContain('"courses"')
      expect(result.error).not.toContain('courses.create')
    }
    // Only the parent lookup should have happened
    expect(db.teacherModuleAccess.findUnique).toHaveBeenCalledTimes(1)
  })

  it('allows (default) when no parent record AND no sub-feature record exist', async () => {
    mockAuthUser = TEACHER
    mockFindUniqueImpl = () => null
    const result = await checkModuleAccess(makeReq(), 'courses.create')
    expect(result.allowed).toBe(true)
    if (result.allowed) {
      expect(result.teacherId).toBe(TEACHER.id)
    }
    expect(db.teacherModuleAccess.findUnique).toHaveBeenCalledTimes(2)
  })

  it('allows when parent has no record (default) but sub-feature is explicitly enabled', async () => {
    mockAuthUser = TEACHER
    mockFindUniqueImpl = ({ where }) => {
      if (where.teacherId_moduleKey.moduleKey === 'courses') return null
      if (where.teacherId_moduleKey.moduleKey === 'courses.create') return { enabled: true }
      return null
    }
    const result = await checkModuleAccess(makeReq(), 'courses.create')
    expect(result.allowed).toBe(true)
    if (result.allowed) {
      expect(result.teacherId).toBe(TEACHER.id)
    }
    expect(db.teacherModuleAccess.findUnique).toHaveBeenCalledTimes(2)
  })

  it('allows when parent is explicitly enabled and sub-feature has no record (default allow)', async () => {
    mockAuthUser = TEACHER
    mockFindUniqueImpl = ({ where }) => {
      if (where.teacherId_moduleKey.moduleKey === 'courses') return { enabled: true }
      // sub-feature lookup returns null
      return null
    }
    const result = await checkModuleAccess(makeReq(), 'courses.create')
    expect(result.allowed).toBe(true)
    expect(db.teacherModuleAccess.findUnique).toHaveBeenCalledTimes(2)
  })
})

describe('checkModuleAccess — DB lookup arguments', () => {
  it('passes the teacher id from the auth user into the DB where clause', async () => {
    mockAuthUser = TEACHER
    mockFindUniqueImpl = () => null
    await checkModuleAccess(makeReq(), 'courses')
    expect(db.teacherModuleAccess.findUnique).toHaveBeenCalledWith({
      where: {
        teacherId_moduleKey: {
          teacherId: TEACHER.id,
          moduleKey: 'courses',
        },
      },
    })
  })

  it('passes the sub-feature moduleKey (with dot) into the second DB lookup', async () => {
    mockAuthUser = TEACHER
    const seenKeys: string[] = []
    mockFindUniqueImpl = ({ where }) => {
      seenKeys.push(where.teacherId_moduleKey.moduleKey)
      return null
    }
    await checkModuleAccess(makeReq(), 'test-series.create')
    expect(seenKeys).toEqual(['test-series', 'test-series.create'])
  })
})
