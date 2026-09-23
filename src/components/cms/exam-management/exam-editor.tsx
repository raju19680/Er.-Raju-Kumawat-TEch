'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { apiFetchJSON, apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import ExamRulesTab from './exam-rules-tab'
import ExamThemeTab from './exam-theme-tab'

interface ExamEditorProps {
  examId: string
  onBack: () => void
}

export default function ExamEditor({ examId, onBack }: ExamEditorProps) {
  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'rules' | 'theme'>('basic')

  useEffect(() => {
    async function fetchExam() {
      try {
        const res = await apiFetchJSON<{ success: boolean; exam: any }>(`/api/teacher/exams/${examId}`)
        if (res.success) {
          setExam(res.exam)
        }
      } catch (error) {
        toast.error('Failed to load exam details')
      } finally {
        setLoading(false)
      }
    }
    fetchExam()
  }, [examId])

  const handleSaveBasic = async () => {
    setSaving(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; exam: any }>(`/api/teacher/exams/${examId}`, {
        method: 'PUT',
        body: JSON.stringify(exam)
      })
      if (res.success) {
        toast.success('Exam details updated')
        setExam(res.exam)
      } else {
        toast.error('Failed to update exam')
      }
    } catch (error) {
      toast.error('Failed to update exam')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!exam) return null

  return (
    <div className="flex flex-col h-full w-full bg-[#f8fafc]">
      <div className="flex-none p-4 sm:p-6 border-b bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{exam.name || 'Untitled Exam'}</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure exam details, rules, and themes.</p>
          </div>
        </div>

        <div className="flex gap-6 mt-6 border-b">
          <button
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === 'basic' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
            {activeTab === 'basic' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
          <button
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === 'rules' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('rules')}
          >
            Exam Rules
            {activeTab === 'rules' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
          <button
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === 'theme' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('theme')}
          >
            Theme
            {activeTab === 'theme' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {activeTab === 'basic' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Exam Name</Label>
                  <Input 
                    value={exam.name}
                    onChange={(e) => setExam({ ...exam, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Exam Code</Label>
                  <Input 
                    value={exam.code || ''}
                    onChange={(e) => setExam({ ...exam, code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input 
                    value={exam.category || ''}
                    onChange={(e) => setExam({ ...exam, category: e.target.value })}
                  />
                </div>
                <Button onClick={handleSaveBasic} disabled={saving} className="w-full mt-4">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Basic Info
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'rules' && <ExamRulesTab examId={examId} />}
        {activeTab === 'theme' && <ExamThemeTab examId={examId} />}
      </div>
    </div>
  )
}
