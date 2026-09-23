'use client'

import React, { useState, useEffect } from 'react'
import { Bookmark, Clock, CheckCircle2, XCircle, ArrowRight, BookOpen, AlertCircle, BookmarkCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetchJSON } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'

interface BookmarkData {
  id: string
  title: string
  createdAt: string
  question: {
    id: string
    title: string
    section: string | null
    type: string
    positiveMarks: number
    negativeMarks: number
    option1: string | null
    option2: string | null
    option3: string | null
    option4: string | null
    option5: string | null
    correctOption: string | null
    solutionHeading: string | null
    solutionText: string | null
    test: {
      id: string
      title: string
      showSolution: boolean
    } | null
  }
}

export function StudentBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const load = async () => {
    setLoading(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; data: BookmarkData[] }>('/api/student/bookmarks')
      if (res.success) {
        setBookmarks(res.data)
      } else {
        setError('Failed to load bookmarks')
      }
    } catch (err) {
      console.error(err)
      setError('Network error loading bookmarks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const removeBookmark = async (questionId: string) => {
    try {
      setBookmarks(prev => prev.filter(b => b.question.id !== questionId))
      await apiFetchJSON(`/api/student/questions/${questionId}/bookmark`, { method: 'POST' })
    } catch (err) {
      console.error(err)
      load() // revert
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="size-12 mx-auto mb-3 text-red-400 opacity-50" />
        <p>{error}</p>
        <Button variant="outline" className="mt-4" onClick={load}>Try Again</Button>
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <Bookmark className="size-16 mx-auto mb-4 text-indigo-300 opacity-50" />
        <h3 className="text-lg font-bold text-gray-900 mb-1">No Bookmarks Yet</h3>
        <p className="text-gray-500">When you take tests, bookmark difficult questions to revise them here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookmarkCheck className="size-6 text-indigo-600" /> My Bookmarks
        </h2>
        <Badge variant="secondary">{bookmarks.length} Saved</Badge>
      </div>

      <div className="grid gap-6">
        {bookmarks.map((b) => (
          <Card key={b.id} className="overflow-hidden border-0 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-100 py-3 px-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                {b.question.section && (
                  <Badge variant="outline" className="bg-white">{b.question.section}</Badge>
                )}
                {b.question.test && (
                  <span className="text-xs font-medium text-gray-500 line-clamp-1">{b.question.test.title}</span>
                )}
              </div>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeBookmark(b.question.id)}>
                Remove
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              <div className="prose prose-sm max-w-none mb-6">
                <div dangerouslySetInnerHTML={{ __html: b.question.title }} />
              </div>
              
              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {[b.question.option1, b.question.option2, b.question.option3, b.question.option4, b.question.option5].map((opt, i) => {
                  if (!opt) return null;
                  const isCorrect = b.question.correctOption === `option${i+1}`
                  return (
                    <div key={i} className={`p-3 rounded-lg border text-sm ${isCorrect && (b.question.test?.showSolution !== false) ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium' : 'bg-white border-gray-200 text-gray-600'}`}>
                      <div className="flex gap-2">
                        <span className="font-bold shrink-0">{String.fromCharCode(65 + i)}.</span>
                        <div dangerouslySetInnerHTML={{ __html: opt }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Solution */}
              {b.question.test?.showSolution !== false && b.question.solutionText && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mt-4">
                  <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <BookOpen className="size-4" /> Solution
                  </h4>
                  {b.question.solutionHeading && <p className="font-medium text-indigo-800 text-sm mb-1">{b.question.solutionHeading}</p>}
                  <div className="text-sm text-indigo-800 prose prose-sm prose-indigo" dangerouslySetInnerHTML={{ __html: b.question.solutionText }} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
