'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, GraduationCap, BookOpen, DollarSign, ClipboardList, FileText, TrendingUp, UserCheck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AdminStats {
  stats: {
    totalTeachers: number
    totalStudents: number
    totalCourses: number
    totalTestSeries: number
    totalNotes: number
    totalEnrollments: number
    totalRevenue: number
    pendingTeachers: number
  }
  monthlyRevenue: { month: string; amount: number }[]
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string }[]
}

export function AdminDashboard() {
  const [data, setData] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  const statCards = [
    { label: 'Total Teachers', value: data.stats.totalTeachers, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Total Students', value: data.stats.totalStudents, icon: GraduationCap, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
    { label: 'Total Courses', value: data.stats.totalCourses, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
    { label: 'Test Series', value: data.stats.totalTestSeries, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Notes Published', value: data.stats.totalNotes, icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
    { label: 'Total Enrollments', value: data.stats.totalEnrollments, icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { label: 'Total Revenue', value: `₹${data.stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
    { label: 'Pending Approvals', value: data.stats.pendingTeachers, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">Welcome back, Admin! 👋</h2>
        <p className="text-white/80">Here's what's happening across your platform today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
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

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Monthly revenue for the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="amount" fill="#059669" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Signups</CardTitle>
          <CardDescription>Latest users who joined the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No users yet</p>
            ) : (
              data.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                      user.role === 'TEACHER' ? 'bg-emerald-600' : user.role === 'STUDENT' ? 'bg-cyan-600' : 'bg-purple-600'
                    }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={
                      user.role === 'TEACHER' ? 'border-emerald-600 text-emerald-600' : 
                      user.role === 'STUDENT' ? 'border-cyan-600 text-cyan-600' : 
                      'border-purple-600 text-purple-600'
                    }>
                      {user.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
