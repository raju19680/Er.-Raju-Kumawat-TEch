'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save } from 'lucide-react'
import { apiFetchJSON } from '@/lib/api-client'
import { toast } from 'sonner'

interface ExamRulesTabProps {
  examId: string
}

export default function ExamRulesTab({ examId }: ExamRulesTabProps) {
  const [rules, setRules] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchRules() {
      try {
        const res = await apiFetchJSON<{ success: boolean; rules: any }>(`/api/teacher/exams/${examId}/rules`)
        if (res.success) {
          setRules(res.rules || {
            shuffleQuestions: false,
            shuffleOptions: false,
            allowSectionJump: true,
            allowQuestionJump: true,
            markingType: 'per_question',
            showResult: 'immediate',
            maxAttempts: 1
          })
        }
      } catch (error) {
        toast.error('Failed to load exam rules')
      } finally {
        setLoading(false)
      }
    }
    fetchRules()
  }, [examId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; rules: any }>(`/api/teacher/exams/${examId}/rules`, {
        method: 'PUT',
        body: JSON.stringify(rules)
      })
      if (res.success) {
        toast.success('Exam rules updated')
        setRules(res.rules)
      } else {
        toast.error('Failed to update rules')
      }
    } catch (error) {
      toast.error('Failed to update rules')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Question Rules</CardTitle>
          <CardDescription>Configure how questions and options are presented.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Shuffle Questions</Label>
              <p className="text-sm text-muted-foreground">Randomize question order for each attempt</p>
            </div>
            <Switch 
              checked={rules.shuffleQuestions}
              onCheckedChange={(c) => setRules({ ...rules, shuffleQuestions: c })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Shuffle Options</Label>
              <p className="text-sm text-muted-foreground">Randomize option order within each question</p>
            </div>
            <Switch 
              checked={rules.shuffleOptions}
              onCheckedChange={(c) => setRules({ ...rules, shuffleOptions: c })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Navigation Rules</CardTitle>
          <CardDescription>Control how students move through the exam.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Section Jump</Label>
              <p className="text-sm text-muted-foreground">Students can switch between sections freely</p>
            </div>
            <Switch 
              checked={rules.allowSectionJump}
              onCheckedChange={(c) => setRules({ ...rules, allowSectionJump: c })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Question Jump</Label>
              <p className="text-sm text-muted-foreground">Students can skip and jump to specific questions</p>
            </div>
            <Switch 
              checked={rules.allowQuestionJump}
              onCheckedChange={(c) => setRules({ ...rules, allowQuestionJump: c })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attempt & Result Rules</CardTitle>
          <CardDescription>Set limits and result visibility.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Max Attempts</Label>
            <Input 
              type="number"
              value={rules.maxAttempts}
              onChange={(e) => setRules({ ...rules, maxAttempts: parseInt(e.target.value) || 1 })}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save Rules
      </Button>
    </div>
  )
}
