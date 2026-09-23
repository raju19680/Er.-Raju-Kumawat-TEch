'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { Search, GraduationCap } from 'lucide-react'

interface StudentRow {
  id: string
  name: string | null
  email: string
  username: string
  createdAt: string
  teacher: { name: string | null } | null
  _count: { enrollments: number; testAttempts: number }
}

export function AdminAllStudents() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/students')
      .then((r) => r.json())
      .then((data) => setStudents(data.students || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = students.filter((s) => {
    const q = search.toLowerCase()
    return !q || s.name?.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.username.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">All Students</h2>
        <p className="text-sm text-muted-foreground mt-1">View all students across the platform</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden md:table-cell">Teacher</TableHead>
                    <TableHead className="hidden sm:table-cell">Activity</TableHead>
                    <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((student) => (
                    <TableRow key={student.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarFallback className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400 text-sm font-semibold">
                              {student.name?.charAt(0).toUpperCase() || 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{student.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {student.teacher ? <Badge variant="outline">{student.teacher.name}</Badge> : <span className="text-xs text-muted-foreground">Direct signup</span>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex gap-2">
                          <Badge variant="outline">{student._count.enrollments} courses</Badge>
                          <Badge variant="outline">{student._count.testAttempts} tests</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
