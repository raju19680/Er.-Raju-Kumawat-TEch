'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DollarSign, BookOpen, ClipboardList, FileText, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RevenueData {
  payments: {
    id: string
    amount: number
    type: string
    itemName: string
    createdAt: string
    user: { id: string; name: string | null; email: string; role: string }
  }[]
  totalRevenue: number
  revenueByType: { COURSE: number; TEST_SERIES: number; NOTES: number }
  teacherRevenue: {
    id: string
    name: string | null
    username: string
    revenue: number
    courseCount: number
    testCount: number
    notesCount: number
  }[]
}

export function AdminRevenue() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/revenue')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
  }

  const chartData = [
    { name: 'Courses', amount: data.revenueByType.COURSE, fill: '#059669' },
    { name: 'Test Series', amount: data.revenueByType.TEST_SERIES, fill: '#d97706' },
    { name: 'Notes', amount: data.revenueByType.NOTES, fill: '#e11d48' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Revenue Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">Platform-wide revenue insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <CardContent className="p-5">
            <DollarSign className="w-8 h-8 text-white/80 mb-2" />
            <p className="text-3xl font-bold">₹{data.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-white/80 mt-1">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-2"><BookOpen className="w-5 h-5 text-emerald-600" /></div>
            <p className="text-2xl font-bold">₹{data.revenueByType.COURSE.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">From Courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-2"><ClipboardList className="w-5 h-5 text-amber-600" /></div>
            <p className="text-2xl font-bold">₹{data.revenueByType.TEST_SERIES.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">From Test Series</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mb-2"><FileText className="w-5 h-5 text-rose-600" /></div>
            <p className="text-2xl font-bold">₹{data.revenueByType.NOTES.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">From Notes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Content Type</CardTitle>
            <CardDescription>Distribution of earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Earning Teachers</CardTitle>
            <CardDescription>Best performing educators</CardDescription>
          </CardHeader>
          <CardContent>
            {data.teacherRevenue.length === 0 || data.teacherRevenue[0].revenue === 0 ? (
              <div className="text-center py-8"><TrendingUp className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" /><p className="text-sm text-muted-foreground">No revenue data yet</p></div>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {data.teacherRevenue.filter((t) => t.revenue > 0).map((teacher, idx) => (
                  <div key={teacher.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 font-semibold text-sm shrink-0">{idx + 1}</div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{teacher.name}</p>
                        <p className="text-xs text-muted-foreground">{teacher.courseCount} courses · {teacher.testCount} tests · {teacher.notesCount} notes</p>
                      </div>
                    </div>
                    <p className="font-bold text-emerald-600 shrink-0 ml-2">₹{teacher.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest payment activity</CardDescription>
        </CardHeader>
        <CardContent>
          {data.payments.length === 0 ? (
            <div className="text-center py-8"><DollarSign className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" /><p className="text-sm text-muted-foreground">No transactions yet</p></div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {data.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">{payment.user.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{payment.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{payment.itemName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className="text-xs">{payment.type.replace('_', ' ')}</Badge>
                    <span className="font-semibold text-emerald-600">₹{payment.amount}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">{new Date(payment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
