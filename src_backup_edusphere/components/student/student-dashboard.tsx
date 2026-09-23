'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { BookOpen, ClipboardList, FileText, Award, DollarSign, TrendingUp, Play, Library } from 'lucide-react'
import { useUIStore } from '@/lib/store'

interface StudentStats {
  stats: {
    totalEnrollments: number
    totalCompleted: number
    totalTestsTaken: number
    totalNotesPurchased: number
    totalSpent: number
    avgScore: number
  }
  recentEnrollments: {
    id: string
    progress: number
    course: {
      id: string
      title: string
      thumbnail: string | null
      teacher: { name: string | null }
    }
  }[]
}

export function StudentDashboard() {
  const [data, setData] = useState<StudentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const setView = useUIStore((s) => s.setView)

  useEffect(() => {
    fetch('/api/student/stats')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
  }

  const statCards = [
    { label: 'Enrolled Courses', value: data.stats.totalEnrollments, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', onClick: () => setView('student-my-courses') },
    { label: 'Completed', value: data.stats.totalCompleted, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', onClick: () => setView('student-certificates') },
    { label: 'Tests Taken', value: data.stats.totalTestsTaken, icon: ClipboardList, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30', onClick: () => setView('student-tests') },
    { label: 'Notes Owned', value: data.stats.totalNotesPurchased, icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', onClick: () => setView('student-notes') },
    { label: 'Avg Score', value: `${data.stats.avgScore.toFixed(1)}%`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { label: 'Total Spent', value: `₹${data.stats.totalSpent.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">Keep Learning! 📚</h2>
          <p className="text-white/80 mb-4">Track your progress and discover new content.</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={() => setView('student-courses')}><BookOpen className="w-4 h-4 mr-1" /> Browse Courses</Button>
            <Button variant="secondary" size="sm" onClick={() => setView('student-my-courses')}><Library className="w-4 h-4 mr-1" /> My Courses</Button>
            <Button variant="secondary" size="sm" onClick={() => setView('student-certificates')}><Award className="w-4 h-4 mr-1" /> My Certificates</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className={`hover:shadow-md transition-all ${stat.onClick ? 'cursor-pointer' : ''}`} onClick={stat.onClick}>
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

      <Card>
        <CardHeader>
          <CardTitle>Continue Learning</CardTitle>
          <CardDescription>Pick up where you left off</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentEnrollments.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground mb-4">You haven't enrolled in any courses yet</p>
              <Button onClick={() => setView('student-courses')} className="bg-cyan-600 hover:bg-cyan-700"><BookOpen className="w-4 h-4 mr-2" /> Browse Courses</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shrink-0">
                    {enrollment.course.thumbnail ? <img src={enrollment.course.thumbnail} alt="" className="w-full h-full object-cover rounded-lg" /> : <BookOpen className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{enrollment.course.title}</p>
                    <p className="text-xs text-muted-foreground">by {enrollment.course.teacher.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Progress value={enrollment.progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">{enrollment.progress.toFixed(0)}%</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setView('student-my-courses')} className="shrink-0">
                    <Play className="w-3.5 h-3.5 mr-1" /> Resume
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
