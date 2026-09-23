'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Search, Trash2, Briefcase } from 'lucide-react'
import { apiFetchJSON, apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import ExamEditor from './exam-editor'

interface ExamProfile {
  id: string
  name: string
  code: string | null
  category: string | null
  defaultTestMode: string
}

export default function ExamProfilesPage() {
  const [exams, setExams] = useState<ExamProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeExamId, setActiveExamId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const loadExams = async () => {
    setLoading(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; exams: ExamProfile[] }>('/api/teacher/exams')
      if (res.success) {
        setExams(res.exams || [])
      }
    } catch (error) {
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExams()
  }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; exam: ExamProfile }>('/api/teacher/exams', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Exam Profile',
          category: 'General',
          defaultTestMode: 'CBT'
        })
      })
      if (res.success) {
        toast.success('Exam Profile created')
        setActiveExamId(res.exam.id)
      } else {
        toast.error('Failed to create exam')
      }
    } catch (error) {
      toast.error('Failed to create exam')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this exam profile? This cannot be undone.')) return
    try {
      const res = await apiFetch(`/api/teacher/exams/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Exam profile deleted')
        loadExams()
      } else {
        toast.error('Failed to delete exam profile')
      }
    } catch (error) {
      toast.error('Failed to delete exam profile')
    }
  }

  if (activeExamId) {
    return (
      <ExamEditor 
        examId={activeExamId} 
        onBack={() => {
          setActiveExamId(null)
          loadExams()
        }} 
      />
    )
  }

  const filteredExams = exams.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-none p-4 sm:p-6 border-b bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exam Profiles</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage exams, their rules, and themes.</p>
            </div>
          </div>
          <Button onClick={handleCreate} disabled={creating} className="gap-2">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Exam Profile
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search exams..." 
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredExams.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No exam profiles found</h3>
              <p className="text-gray-500 mb-4 max-w-sm">Create an exam profile to define rules and themes for your tests.</p>
              <Button onClick={handleCreate} disabled={creating} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" /> Create Exam
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExams.map((exam) => (
              <Card 
                key={exam.id} 
                className="cursor-pointer hover:shadow-md transition-all group border"
                onClick={() => setActiveExamId(exam.id)}
              >
                <CardHeader className="pb-3 border-b border-gray-50">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-gray-900 leading-tight">
                      {exam.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={(e) => handleDelete(exam.id, e)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{exam.category || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Code</span>
                    <span className="font-medium">{exam.code || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
