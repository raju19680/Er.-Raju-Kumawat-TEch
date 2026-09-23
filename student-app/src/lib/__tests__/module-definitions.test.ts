import { describe, it, expect } from 'vitest'
import {
  MODULES,
  CMS_PAGE_TO_MODULE,
  type ModuleDefinition,
} from '@/lib/module-definitions'

// Helper functions used by tests below. (The source file does not export these,
// so we recreate them locally to test the *shape* and *content* of MODULES.)
const getModuleByKey = (key: string): ModuleDefinition | undefined =>
  MODULES.find((m) => m.key === key)

const getAllModuleKeys = (): string[] => MODULES.map((m) => m.key)

describe('MODULES array — structural integrity', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(MODULES)).toBe(true)
    expect(MODULES.length).toBeGreaterThan(0)
  })

  it('every module has a unique key', () => {
    const keys = MODULES.map((m) => m.key)
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i)
    expect(dupes).toEqual([])
  })

  it('every module has a non-empty label', () => {
    for (const m of MODULES) {
      expect(typeof m.label).toBe('string')
      expect(m.label.length).toBeGreaterThan(0)
    }
  })

  it('every module has at least 1 feature', () => {
    for (const m of MODULES) {
      expect(Array.isArray(m.features)).toBe(true)
      expect(m.features.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('every feature within a module has a unique key', () => {
    for (const m of MODULES) {
      const featureKeys = m.features.map((f) => f.key)
      const dupes = featureKeys.filter((k, i) => featureKeys.indexOf(k) !== i)
      expect(dupes).toEqual([])
    }
  })

  it('every feature within a module has a non-empty label', () => {
    for (const m of MODULES) {
      for (const f of m.features) {
        expect(typeof f.label).toBe('string')
        expect(f.label.length).toBeGreaterThan(0)
      }
    }
  })

  it('every module has a non-empty icon string', () => {
    for (const m of MODULES) {
      expect(typeof m.icon).toBe('string')
      expect((m.icon as string).length).toBeGreaterThan(0)
    }
  })

  it('every module has a non-empty description', () => {
    for (const m of MODULES) {
      expect(typeof m.description).toBe('string')
      expect(m.description.length).toBeGreaterThan(0)
    }
  })

  it('every module has a non-empty color', () => {
    for (const m of MODULES) {
      expect(typeof m.color).toBe('string')
      expect((m.color as string).length).toBeGreaterThan(0)
    }
  })
})

describe('MODULES array — known modules exist', () => {
  it('includes the "courses" module', () => {
    expect(getModuleByKey('courses')).toBeDefined()
  })

  it('includes the "test-series" module', () => {
    expect(getModuleByKey('test-series')).toBeDefined()
  })

  it('includes the "blogs" module', () => {
    expect(getModuleByKey('blogs')).toBeDefined()
  })

  it('includes the "digital-products" module', () => {
    expect(getModuleByKey('digital-products')).toBeDefined()
  })

  it('includes the "store" module', () => {
    expect(getModuleByKey('store')).toBeDefined()
  })

  it('returns a list of all module keys via getAllModuleKeys equivalent', () => {
    const keys = getAllModuleKeys()
    expect(keys).toContain('courses')
    expect(keys).toContain('test-series')
    expect(keys).toContain('blogs')
    expect(keys).toContain('digital-products')
    expect(keys).toContain('store')
    // Sanity: total count matches MODULES length
    expect(keys.length).toBe(MODULES.length)
  })

  it('returns undefined for unknown module key', () => {
    expect(getModuleByKey('non-existent-module')).toBeUndefined()
  })

  it('has the expected number of features for "courses" (5)', () => {
    const courses = getModuleByKey('courses')
    expect(courses).toBeDefined()
    expect(courses!.features.length).toBe(5)
    expect(courses!.features.map((f) => f.key)).toEqual([
      'create',
      'edit',
      'delete',
      'publish',
      'pricing',
    ])
  })

  it('feature keys may repeat ACROSS modules but are unique WITHIN each module', () => {
    // 'create' is a common feature key across modules — this should NOT cause a failure
    const modulesWithCreate = MODULES.filter((m) =>
      m.features.some((f) => f.key === 'create'),
    )
    expect(modulesWithCreate.length).toBeGreaterThan(1)

    // But within each module, 'create' should only appear once
    for (const m of modulesWithCreate) {
      const createKeys = m.features.filter((f) => f.key === 'create')
      expect(createKeys.length).toBe(1)
    }
  })
})

describe('CMS_PAGE_TO_MODULE mapping', () => {
  it('is a record object', () => {
    expect(typeof CMS_PAGE_TO_MODULE).toBe('object')
    expect(CMS_PAGE_TO_MODULE).not.toBeNull()
  })

  it('is non-empty', () => {
    expect(Object.keys(CMS_PAGE_TO_MODULE).length).toBeGreaterThan(0)
  })

  it('every value is either "__always__" or a valid module key from MODULES', () => {
    const validModuleKeys = new Set<string>(getAllModuleKeys())
    validModuleKeys.add('__always__')

    for (const [page, moduleKey] of Object.entries(CMS_PAGE_TO_MODULE)) {
      expect(validModuleKeys.has(moduleKey)).toBe(true)
    }
  })

  it('every page key is a non-empty string', () => {
    for (const page of Object.keys(CMS_PAGE_TO_MODULE)) {
      expect(typeof page).toBe('string')
      expect(page.length).toBeGreaterThan(0)
    }
  })

  it('maps "dashboard" to "__always__"', () => {
    expect(CMS_PAGE_TO_MODULE['dashboard']).toBe('__always__')
  })

  it('maps "tests" to "test-series"', () => {
    expect(CMS_PAGE_TO_MODULE['tests']).toBe('test-series')
  })

  it('maps "results" to "test-series" (shared parent)', () => {
    expect(CMS_PAGE_TO_MODULE['results']).toBe('test-series')
  })

  it('maps "reported-questions" to "test-series" (shared parent)', () => {
    expect(CMS_PAGE_TO_MODULE['reported-questions']).toBe('test-series')
  })

  it('maps "blogs" to "blogs"', () => {
    expect(CMS_PAGE_TO_MODULE['blogs']).toBe('blogs')
  })

  it('maps "store" to "store"', () => {
    expect(CMS_PAGE_TO_MODULE['store']).toBe('store')
  })

  it('maps "payment-pages" to "store"', () => {
    expect(CMS_PAGE_TO_MODULE['payment-pages']).toBe('store')
  })

  it('maps settings pages to "__always__"', () => {
    expect(CMS_PAGE_TO_MODULE['settings-profile']).toBe('__always__')
    expect(CMS_PAGE_TO_MODULE['settings-security']).toBe('__always__')
    expect(CMS_PAGE_TO_MODULE['settings-blocked']).toBe('__always__')
    expect(CMS_PAGE_TO_MODULE['settings-categories']).toBe('__always__')
  })

  it('returns undefined for unknown pages', () => {
    expect(CMS_PAGE_TO_MODULE['unknown-page']).toBeUndefined()
    expect(CMS_PAGE_TO_MODULE['']).toBeUndefined()
    expect(CMS_PAGE_TO_MODULE['totally-fake-page-xyz']).toBeUndefined()
  })

  it('every mapped module key has a corresponding entry in MODULES (except __always__)', () => {
    const moduleKeySet = new Set(getAllModuleKeys())
    for (const moduleKey of Object.values(CMS_PAGE_TO_MODULE)) {
      if (moduleKey === '__always__') continue
      expect(moduleKeySet.has(moduleKey)).toBe(true)
    }
  })
})
