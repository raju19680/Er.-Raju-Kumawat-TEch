'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Upload } from 'lucide-react'
import { apiFetchJSON } from '@/lib/api-client'
import { toast } from 'sonner'

interface ExamThemeTabProps {
  examId: string
}

export default function ExamThemeTab({ examId }: ExamThemeTabProps) {
  const [theme, setTheme] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchTheme() {
      try {
        const res = await apiFetchJSON<{ success: boolean; theme: any }>(`/api/teacher/exams/${examId}/themes`)
        if (res.success) {
          setTheme(res.theme || {
            primaryColor: '#3b82f6',
            secondaryColor: '#ffffff',
            fontFamily: 'Inter',
            watermarkText: ''
          })
        }
      } catch (error) {
        toast.error('Failed to load exam theme')
      } finally {
        setLoading(false)
      }
    }
    fetchTheme()
  }, [examId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; theme: any }>(`/api/teacher/exams/${examId}/themes`, {
        method: 'PUT',
        body: JSON.stringify(theme)
      })
      if (res.success) {
        toast.success('Exam theme updated')
        setTheme(res.theme)
      } else {
        toast.error('Failed to update theme')
      }
    } catch (error) {
      toast.error('Failed to update theme')
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
          <CardTitle>Colors & Branding</CardTitle>
          <CardDescription>Customize the visual appearance of the exam.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  value={theme.primaryColor}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input 
                  type="text" 
                  value={theme.primaryColor}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  className="flex-1 uppercase font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary Color</Label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  value={theme.secondaryColor}
                  onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input 
                  type="text" 
                  value={theme.secondaryColor}
                  onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                  className="flex-1 uppercase font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Logo URL</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="https://example.com/logo.png"
                value={theme.logoUrl || ''}
                onChange={(e) => setTheme({ ...theme, logoUrl: e.target.value })}
              />
              <Button variant="outline" size="icon">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Typography & Watermark</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Font Family</Label>
            <Input 
              value={theme.fontFamily}
              onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })}
              placeholder="e.g. Inter, Arial, sans-serif"
            />
          </div>
          <div className="space-y-2">
            <Label>Watermark Text</Label>
            <Input 
              value={theme.watermarkText}
              onChange={(e) => setTheme({ ...theme, watermarkText: e.target.value })}
              placeholder="Leave empty for no watermark"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save Theme
      </Button>
    </div>
  )
}
