'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { BookOpen, ClipboardList, FileText, Users, DollarSign, TrendingUp, Plus, Eye, Calendar, Trophy, Medal } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { useAppStore } from '@/lib/store'

interface TeacherStats {
  stats: {
    totalCourses: number
    totalTestSeries: number
    totalNotes: number
    totalStudents: number
    totalEnrollments: number
    totalRevenue: number
    rank: number
    totalPlatformTeachers: number
  }
  enrollmentTrend: { month: string; count: number }[]
  dailyEarnings: { date: string; amount: number }[]
  topCourses: {
    id: string
    title: string
    price: number
    _count: { purchasedBy: number }
  }[]
}

export function TeacherDashboard() {
  const [data, setData] = useState<TeacherStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const setCurrentPage = useAppStore((s) => s.setCurrentPage)
  const user = useAppStore((s) => s.userName)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/teacher/stats?dateFrom=${dateFrom}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [dateFrom])

  if (loading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    )
  }

  const statCards = [
    { label: 'Platform Rank', value: `#${data.stats.rank} / ${data.stats.totalPlatformTeachers}`, icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
    { label: 'Revenue in Period', value: `₹${data.stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', onClick: () => setCurrentPage('reports-sales') },
    { label: 'My Courses', value: data.stats.totalCourses, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', onClick: () => setCurrentPage('store') },
    { label: 'Total Students', value: data.stats.totalStudents, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30', onClick: () => setCurrentPage('dashboard') },
    { label: 'Total Enrollments', value: data.stats.totalEnrollments, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { label: 'Test Series', value: data.stats.totalTestSeries, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', onClick: () => setCurrentPage('tests') },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">Welcome, {user}! 🎓</h2>
          <p className="text-white/80 mb-4">Manage your courses, tests, and students from your CMS portal.</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={() => setCurrentPage('store')}>
              <Plus className="w-4 h-4 mr-1" /> New Course
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setCurrentPage('tests')}>
              <Plus className="w-4 h-4 mr-1" /> New Test Series
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setCurrentPage('settings-profile')}>
              <Eye className="w-4 h-4 mr-1" /> View My Website
            </Button>
          </div>
        </div>
      </div>

      {/* Date Filter & Overview */}
      <div className="flex items-center justify-between pt-4">
        <h3 className="text-lg font-bold">Performance Dashboard</h3>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">From:</span>
          <input 
            type="date" 
            value={dateFrom} 
            onChange={(e) => setDateFrom(e.target.value)} 
            className="border border-border rounded-md px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

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
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${stat.bg}`}>
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

        {/* Daily Earnings Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Earnings</CardTitle>
            <CardDescription>Revenue generated per day since the selected date</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.dailyEarnings}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis className="text-xs" tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(val: number) => [`₹${val}`, 'Revenue']}
                  labelFormatter={(val) => new Date(val).toLocaleDateString()}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
              </LineChart>
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
                <BookOpen className="w-11 h-11 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No courses yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.topCourses.map((course, idx) => {
                  const maxEnrollments = data.topCourses[0]?._count.purchasedBy || 1
                  const pct = (course._count.purchasedBy / maxEnrollments) * 100
                  return (
                    <div key={course.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="shrink-0">#{idx + 1}</Badge>
                          <p className="text-sm font-medium truncate">{course.title}</p>
                        </div>
                        <span className="text-sm font-semibold text-muted-foreground shrink-0 ml-2">
                          {course._count.purchasedBy}
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
