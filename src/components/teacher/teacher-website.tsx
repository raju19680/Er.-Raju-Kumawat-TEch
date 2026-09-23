'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { BookOpen, ClipboardList, FileText, Users, ExternalLink, Globe, Copy, Building2, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface WebsiteData {
  courses: { id: string; title: string; description: string; price: number; category: string | null; _count: { enrollments: number; lessons: number } }[]
  testSeries: { id: string; title: string; description: string; price: number; category: string | null; _count: { tests: number; purchases: number } }[]
  notes: { id: string; title: string; description: string; price: number; category: string | null; _count: { purchases: number } }[]
}

export function TeacherWebsite() {
  const user = useAppStore((s) => s.userName)
  const setCurrentPage = useAppStore((s) => s.setCurrentPage)
  const [data, setData] = useState<WebsiteData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/catalog/courses?teacherId=' + '').then((r) => r.json()),
      fetch('/api/catalog/tests?teacherId=' + '').then((r) => r.json()),
      fetch('/api/catalog/notes?teacherId=' + '').then((r) => r.json()),
    ]).then(([c, t, n]) => {
      setData({ courses: c.courses || [], testSeries: t.testSeries || [], notes: n.notes || [] })
      setLoading(false)
    })
  }, [''])

  const copySlug = () => {
    navigator.clipboard.writeText(`/teacher/${''}`)
    toast.success('Website URL copied!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">My Public Website</h2>
        <p className="text-sm text-muted-foreground">This is what students see on your public page</p>
      </div>

      {/* Website info card */}
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5" />
                <h3 className="text-xl font-bold">{user}'s Academy</h3>
              </div>
              <div className="space-y-1 text-sm text-white/90">
                <p className="flex items-center gap-2"><Building2 className="w-4 h-4" /> {''}</p>
                <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {''}</p>
                <p className="flex items-center gap-2 font-mono text-xs bg-white/10 px-2 py-0.5 rounded inline-flex">
                  /teacher/{''}
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={copySlug} className="bg-white text-emerald-700 hover:bg-white/90">
              <Copy className="w-4 h-4 mr-2" /> Copy URL
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading || !data ? (
        <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center"><BookOpen className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{data.courses.length}</p><p className="text-xs text-muted-foreground">Courses</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center"><ClipboardList className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{data.testSeries.length}</p><p className="text-xs text-muted-foreground">Test Series</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center"><FileText className="w-5 h-5 text-rose-600" /></div><div><p className="text-2xl font-bold">{data.notes.length}</p><p className="text-xs text-muted-foreground">Notes</p></div></CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center"><Users className="w-5 h-5 text-cyan-600" /></div><div><p className="text-2xl font-bold">{data.courses.reduce((a, c) => a + c._count.enrollments, 0) + data.testSeries.reduce((a, t) => a + t._count.purchases, 0) + data.notes.reduce((a, n) => a + n._count.purchases, 0)}</p><p className="text-xs text-muted-foreground">Total Learners</p></div></CardContent></Card>
          </div>

          {/* Preview content */}
          <Card>
            <CardHeader>
              <CardTitle>Website Preview</CardTitle>
              <CardDescription>Live preview of your published content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Courses section */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-600" /> Courses ({data.courses.length})</h3>
                {data.courses.length === 0 ? <p className="text-sm text-muted-foreground pl-6">No published courses</p> : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 pl-6">
                    {data.courses.map((c) => (
                      <div key={c.id} className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                        <p className="font-medium text-sm line-clamp-1">{c.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">{c._count.lessons} lessons</Badge>
                          <span className="text-sm font-bold text-emerald-600">₹{c.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Test series section */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-amber-600" /> Test Series ({data.testSeries.length})</h3>
                {data.testSeries.length === 0 ? <p className="text-sm text-muted-foreground pl-6">No published test series</p> : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 pl-6">
                    {data.testSeries.map((t) => (
                      <div key={t.id} className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                        <p className="font-medium text-sm line-clamp-1">{t.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">{t._count.tests} tests</Badge>
                          <span className="text-sm font-bold text-emerald-600">₹{t.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes section */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-rose-600" /> Notes ({data.notes.length})</h3>
                {data.notes.length === 0 ? <p className="text-sm text-muted-foreground pl-6">No published notes</p> : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 pl-6">
                    {data.notes.map((n) => (
                      <div key={n.id} className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                        <p className="font-medium text-sm line-clamp-1">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{n.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">{n._count.purchases} sold</Badge>
                          <span className="text-sm font-bold text-emerald-600">₹{n.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setCurrentPage('store')}><BookOpen className="w-4 h-4 mr-2" /> Manage Courses</Button>
            <Button variant="outline" onClick={() => setCurrentPage('tests')}><ClipboardList className="w-4 h-4 mr-2" /> Manage Tests</Button>
          </div>
        </>
      )}
    </div>
  )
}
