import re

with open('src/components/cms/test-portal/question-library.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
if 'useQuery' not in content:
    content = content.replace("import React, { useState, useEffect, useCallback } from 'react'", "import React, { useState, useEffect, useCallback } from 'react'\nimport { useQuery, useQueryClient } from '@tanstack/react-query'")

# 2. Replace State and useEffect with useQuery
old_logic = re.compile(r'    // Data state\n    const \[questions, setQuestions\].*?fetchQuestions\(\)\n  \}, \[fetchQuestions\]\)', re.DOTALL)

new_logic = '''    // React Query Client
    const queryClient = useQueryClient()

    // Filter state
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [sectionFilter, setSectionFilter] = useState<string>('all')
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
    const [page, setPage] = useState(1)
    const limit = 10

    // Fetch questions using React Query
    const { data, isLoading: loading, isError, error: queryError } = useQuery({
      queryKey: ['questions', page, search, typeFilter, sectionFilter, difficultyFilter],
      queryFn: async () => {
        const params = new URLSearchParams()
        params.set('page', page.toString())
        params.set('limit', limit.toString())
        if (search) params.set('search', search)
        if (typeFilter !== 'all') params.set('type', typeFilter)
        if (sectionFilter !== 'all') params.set('section', sectionFilter)
        if (difficultyFilter !== 'all') params.set('difficulty', difficultyFilter)

        const res = await apiFetch(/api/teacher/questions?)
        if (!res.ok) throw new Error('Failed to fetch questions')
        return res.json() as Promise<QuestionsResponse>
      }
    })

    const questions = data?.items || []
    const total = data?.total || 0
    const error = isError ? (queryError?.message || 'Error loading') : null
'''

content = old_logic.sub(new_logic, content, count=1)

# Remove the old filter state block (since we moved it above)
content = re.sub(r'    // Filter state\n    const \[search, setSearch\].*?const limit = 50\n', '', content, flags=re.DOTALL)

# Fix mutations to invalidate queries instead of calling fetchQuestions()
content = content.replace('fetchQuestions()', 'queryClient.invalidateQueries({ queryKey: [\'questions\'] })')

with open('src/components/cms/test-portal/question-library.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Refactored successfully")
