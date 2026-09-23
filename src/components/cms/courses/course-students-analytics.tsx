'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiFetchJSON } from '@/lib/api-client'
import { Loader2, Users, CheckCircle, TrendingUp, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatDistanceToNow } from 'date-fns'

interface StudentAnalytic {
  studentId: string
  studentName: string
  studentEmail: string
  studentPhone: string
  enrolledAt: string
  completedLessons: number
  totalLessons: number
  progressPercent: number
  lastActive: string
}

export function CourseStudentsAnalytics({ courseId }: { courseId: string }) {
  const [data, setData] = useState<{ analytics: StudentAnalytic[], overview: any } | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetchJSON(`/api/teacher/courses/${courseId}/analytics`)
        if (res.success) {
          setData(res)
        }
      } catch (e) {
        console.error('Failed to load analytics', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId])

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
  }

  if (!data) {
    return <div className="p-4 text-center text-muted-foreground">Failed to load analytics</div>
  }

  const filteredStudents = data.analytics.filter(s => 
    s.studentName?.toLowerCase().includes(search.toLowerCase()) || 
    s.studentEmail?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentPhone?.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Users className="h-4 w-4" /> Total Enrolled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalEnrolled}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Average Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.avgProgress}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{data.overview.totalRevenue.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle>Student Progress</CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search students..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Student</th>
                  <th className="px-4 py-3 text-left font-medium">Enrolled</th>
                  <th className="px-4 py-3 text-left font-medium">Progress</th>
                  <th className="px-4 py-3 text-left font-medium">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student.studentId} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{student.studentName}</div>
                        <div className="text-xs text-muted-foreground">{student.studentEmail || student.studentPhone}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(student.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2 min-w-[80px]">
                            <div 
                              className="bg-emerald-600 h-2 rounded-full" 
                              style={{ width: `${student.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{student.progressPercent}%</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {student.completedLessons} / {student.totalLessons} lessons
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(student.lastActive), { addSuffix: true })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
