'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { BookOpen, ClipboardList, FileText, Users, DollarSign, TrendingUp, Plus, Eye } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useUIStore } from '@/lib/store'
import { useAuthStore } from '@/lib/store'

interface TeacherStats {
  stats: {
    totalCourses: number
    totalTestSeries: number
    totalNotes: number
    totalStudents: number
    totalEnrollments: number
    totalRevenue: number
  }
  enrollmentTrend: { month: string; count: number }[]
  topCourses: {
    id: string
    title: string
    price: number
    _count: { enrollments: number }
  }[]
}

export function TeacherDashboard() {
  const [data, setData] = useState<TeacherStats | null>(null)
  const [loading, setLoading] = useState(true)
  const setView = useUIStore((s) => s.setView)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    fetch('/api/teacher/stats')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    )
  }

  const statCards = [
    { label: 'My Courses', value: data.stats.totalCourses, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', onClick: () => setView('teacher-courses') },
    { label: 'Test Series', value: data.stats.totalTestSeries, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', onClick: () => setView('teacher-tests') },
    { label: 'Notes Published', value: data.stats.totalNotes, icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', onClick: () => setView('teacher-notes') },
    { label: 'Total Students', value: data.stats.totalStudents, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30', onClick: () => setView('teacher-students') },
    { label: 'Total Enrollments', value: data.stats.totalEnrollments, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { label: 'Total Revenue', value: `₹${data.stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', onClick: () => setView('teacher-revenue') },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">Welcome, {user?.name}! 🎓</h2>
          <p className="text-white/80 mb-4">Manage your courses, tests, and students from your CMS portal.</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={() => setView('teacher-courses')}>
              <Plus className="w-4 h-4 mr-1" /> New Course
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setView('teacher-tests')}>
              <Plus className="w-4 h-4 mr-1" /> New Test Series
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setView('teacher-website')}>
              <Eye className="w-4 h-4 mr-1" /> View My Website
            </Button>
          </div>
        </div>
      </div>

      {/* Pending status notice */}
      {user?.teacherStatus === 'PENDING' && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            ⏳ Your account is pending admin approval. You can create content, but it won't be visible to students until approved.
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card 
            key={stat.label} 
            className={`hover:shadow-md transition-all ${stat.onClick ? 'cursor-pointer' : ''}`}
            onClick={stat.onClick}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enrollment Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Trend</CardTitle>
            <CardDescription>New enrollments over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.enrollmentTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#0891b2" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Top Courses by Enrollment</CardTitle>
            <CardDescription>Your most popular courses</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topCourses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No courses yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.topCourses.map((course, idx) => {
                  const maxEnrollments = data.topCourses[0]?._count.enrollments || 1
                  const pct = (course._count.enrollments / maxEnrollments) * 100
                  return (
                    <div key={course.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="shrink-0">#{idx + 1}</Badge>
                          <p className="text-sm font-medium truncate">{course.title}</p>
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground shrink-0 ml-2">
                          {course._count.enrollments}
                        </span>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <p className="text-xs text-muted-foreground">₹{course.price}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
