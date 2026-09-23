'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { Search, BookOpen, ClipboardList, Users } from 'lucide-react'

interface CourseRow {
  id: string
  title: string
  price: number
  isPublished: boolean
  category: string | null
  level: string
  createdAt: string
  teacher: { id: string; name: string | null; username: string }
  _count: { lessons: number; enrollments: number }
}

interface TestSeriesRow {
  id: string
  title: string
  price: number
  isPublished: boolean
  category: string | null
  createdAt: string
  teacher: { id: string; name: string | null; username: string }
  _count: { tests: number; purchases: number }
}

export function AdminAllCourses() {
  const [courses, setCourses] = useState<CourseRow[]>([])
  const [testSeries, setTestSeries] = useState<TestSeriesRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/courses')
      .then((r) => r.json())
      .then((data) => {
        setCourses(data.courses || [])
        setTestSeries(data.testSeries || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredCourses = courses.filter((c) => {
    const q = search.toLowerCase()
    return !q || c.title.toLowerCase().includes(q) || c.teacher.name?.toLowerCase().includes(q)
  })

  const filteredTests = testSeries.filter((t) => {
    const q = search.toLowerCase()
    return !q || t.title.toLowerCase().includes(q) || t.teacher.name?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">All Content</h2>
        <p className="text-sm text-muted-foreground mt-1">View all courses and test series across the platform</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by title or teacher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Courses ({courses.length})</TabsTrigger>
          <TabsTrigger value="tests">Test Series ({testSeries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : filteredCourses.length === 0 ? (
                <div className="p-12 text-center"><BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">No courses found</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead className="hidden md:table-cell">Teacher</TableHead>
                        <TableHead className="hidden sm:table-cell">Stats</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses.map((course) => (
                        <TableRow key={course.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{course.title}</p>
                              <p className="text-xs text-muted-foreground">{course.category} · {course.level}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6"><AvatarFallback className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">{course.teacher.name?.charAt(0) || 'T'}</AvatarFallback></Avatar>
                              <span className="text-sm">{course.teacher.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex gap-2">
                              <Badge variant="outline">{course._count.lessons} lessons</Badge>
                              <Badge variant="outline">{course._count.enrollments} enrolled</Badge>
                            </div>
                          </TableCell>
                          <TableCell><span className="font-semibold">₹{course.price}</span></TableCell>
                          <TableCell>{course.isPublished ? <Badge className="bg-emerald-600">Published</Badge> : <Badge variant="secondary">Draft</Badge>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : filteredTests.length === 0 ? (
                <div className="p-12 text-center"><ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">No test series found</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Test Series</TableHead>
                        <TableHead className="hidden md:table-cell">Teacher</TableHead>
                        <TableHead className="hidden sm:table-cell">Stats</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTests.map((ts) => (
                        <TableRow key={ts.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{ts.title}</p>
                              <p className="text-xs text-muted-foreground">{ts.category || 'General'}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6"><AvatarFallback className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">{ts.teacher.name?.charAt(0) || 'T'}</AvatarFallback></Avatar>
                              <span className="text-sm">{ts.teacher.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex gap-2">
                              <Badge variant="outline">{ts._count.tests} tests</Badge>
                              <Badge variant="outline">{ts._count.purchases} sold</Badge>
                            </div>
                          </TableCell>
                          <TableCell><span className="font-semibold">₹{ts.price}</span></TableCell>
                          <TableCell>{ts.isPublished ? <Badge className="bg-emerald-600">Published</Badge> : <Badge variant="secondary">Draft</Badge>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
