import re

with open('src/components/cms/test-portal/question-library.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add useInfiniteQuery import
if "useInfiniteQuery" not in content:
    content = content.replace("import React, { useState, useEffect, useCallback } from 'react'", "import React, { useState, useEffect, useCallback, useRef } from 'react'\nimport { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'")

# Replace state and effects
old_states = re.compile(r'    // Data state\n    const \[questions, setQuestions\] = useState<Question\[\]>\(\[\]\)\n    const \[total, setTotal\] = useState\(0\)\n    const \[loading, setLoading\] = useState\(true\)\n    const \[error, setError\] = useState<string \| null>\(null\)', re.MULTILINE)

new_states = '''    // React Query Client
    const queryClient = useQueryClient()

    // Filter state (moved up)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [sectionFilter, setSectionFilter] = useState<string>('all')
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
    
    // React Query Infinite Fetching
    const {
      data,
      isLoading: loading,
      isError,
      error: queryError,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage
    } = useInfiniteQuery({
      queryKey: ['questions', search, typeFilter, sectionFilter, difficultyFilter],
      queryFn: async ({ pageParam = 1 }) => {
        const params = new URLSearchParams()
        params.set('page', pageParam.toString())
        params.set('limit', '50')
        if (search) params.set('search', search)
        if (typeFilter !== 'all') params.set('type', typeFilter)
        if (sectionFilter !== 'all') params.set('section', sectionFilter)
        if (difficultyFilter !== 'all') params.set('difficulty', difficultyFilter)
        
        const res = await apiFetch(/api/teacher/questions?)
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json() as Promise<QuestionsResponse>
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        const loaded = allPages.reduce((acc, page) => acc + (page.items?.length || 0), 0)
        return loaded < (lastPage.total || 0) ? allPages.length + 1 : undefined
      }
    })
    
    const questions = data?.pages.flatMap(p => p.items) || []
    const total = data?.pages[0]?.total || 0
    const error = queryError?.message || null

    // Intersection Observer for Infinite Scroll
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
      if (loading || isFetchingNextPage) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      })
      if (node) observerRef.current.observe(node)
    }, [loading, isFetchingNextPage, hasNextPage, fetchNextPage])
'''
content = old_states.sub(new_states, content, count=1)

# Remove the old filter state block
content = re.sub(r'    // Filter state\n    const \[search, setSearch\].*?useState<\'grid\' \| \'list\'>\(\'list\'\)\n', '', content, flags=re.DOTALL)

# Remove old fetchQuestions and pagination state
content = re.sub(r'    const \[page, setPage\] = useState\(1\)\n    const limit = 50\n.*?renderPagination\(\) \{.*?\n  \}\n', '', content, flags=re.DOTALL)
content = re.sub(r'    //  Fetch questions .*?\n  \}, \[page, search, typeFilter, sectionFilter, difficultyFilter\]\)\n', '', content, flags=re.DOTALL)

# Replace the pagination render with the Load More div
content = content.replace('{!loading && !error && renderPagination()}', '{!loading && !error && hasNextPage && (<div ref={loadMoreRef} className="py-8 flex justify-center">{isFetchingNextPage ? <Loader2 className="h-6 w-6 animate-spin text-gray-500" /> : <div className="h-6" />}</div>)}')

# Update mutations to use queryClient.invalidateQueries
content = content.replace('fetchQuestions()', 'queryClient.invalidateQueries({ queryKey: ["questions"] })')

# Import Loader2
if "Loader2" not in content:
    content = content.replace("} from 'lucide-react'", ", Loader2 } from 'lucide-react'")

with open('src/components/cms/test-portal/question-library.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
