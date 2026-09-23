import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility (className merge)', () => {
  it('merges multiple class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('deduplicates conflicting tailwind classes (twMerge)', () => {
    // twMerge should keep the last conflicting class
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
  })
})
