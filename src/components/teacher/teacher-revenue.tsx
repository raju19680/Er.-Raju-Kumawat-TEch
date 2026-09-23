'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, BookOpen, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RevenueData {
  stats: {
    totalCourses: number
    totalTestSeries: number
    totalNotes: number
    totalStudents: number
    totalEnrollments: number
    totalRevenue: number
  }
  enrollmentTrend: { month: string; count: number }[]
  topCourses: { id: string; title: string; price: number; _count: { enrollments: number } }[]
}

export function TeacherRevenue() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/teacher/stats')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
  }

  const revenueByCourse = data.topCourses.reduce((sum, c) => sum + (c.price * c._count.enrollments), 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Revenue Analytics</h2>
        <p className="text-sm text-muted-foreground">Track your earnings and content performance</p>
      </div>

      {/* Revenue cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <DollarSign className="w-8 h-8 text-white/80" />
              <Badge className="bg-white/20 text-white border-0">Total</Badge>
            </div>
            <p className="text-3xl font-bold">₹{data.stats.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-white/80 mt-1">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="w-11 h-11 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-cyan-600" /></div>
            </div>
            <p className="text-2xl font-bold">{data.stats.totalEnrollments}</p>
            <p className="text-sm text-muted-foreground">Total Enrollments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="w-11 h-11 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center"><BookOpen className="w-5 h-5 text-purple-600" /></div>
            </div>
            <p className="text-2xl font-bold">₹{revenueByCourse.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">From Courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center"><Users className="w-5 h-5 text-amber-600" /></div>
            </div>
            <p className="text-2xl font-bold">{data.stats.totalStudents}</p>
            <p className="text-sm text-muted-foreground">Direct Students</p>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment chart */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Growth</CardTitle>
          <CardDescription>New enrollments over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.enrollmentTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#059669" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top earning courses */}
      <Card>
        <CardHeader>
          <CardTitle>Top Earning Courses</CardTitle>
          <CardDescription>Your best performing courses by enrollment</CardDescription>
        </CardHeader>
        <CardContent>
          {data.topCourses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-11 h-11 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No course data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.topCourses.map((course, idx) => (
                <div key={course.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 font-semibold text-sm shrink-0">{idx + 1}</div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{course.title}</p>
                      <p className="text-xs text-muted-foreground">{course._count.enrollments} enrollments · ₹{course.price} each</p>
                    </div>
                  </div>
                  <p className="font-bold text-emerald-600 shrink-0 ml-2">₹{(course.price * course._count.enrollments).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


