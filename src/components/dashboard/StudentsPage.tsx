'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  SlidersHorizontal,
  MoreVertical,
  UserCheck,
  UserX,
  GraduationCap,
  Users,
  Mail,
  Phone,
  Eye,
  Edit3,
  Trash2,
  Shield,
  ShieldOff,
  Download,
} from 'lucide-react'

// ─── Student data ───────────────────────────────────────────────────────────────
interface Student {
  id: number
  name: string
  email: string
  phone: string
  status: 'active' | 'blocked'
  joinedDate: string
  courses: number
  lastActive: string
}

const students: Student[] = [
  { id: 1, name: 'Aarav Patel', email: 'aarav.patel@email.com', phone: '+91 98765 43210', status: 'active', joinedDate: 'Jan 15, 2026', courses: 3, lastActive: '2 hours ago' },
  { id: 2, name: 'Priya Sharma', email: 'priya.sharma@email.com', phone: '+91 87654 32109', status: 'active', joinedDate: 'Feb 3, 2026', courses: 2, lastActive: '5 hours ago' },
  { id: 3, name: 'Rohit Kumar', email: 'rohit.kumar@email.com', phone: '+91 76543 21098', status: 'active', joinedDate: 'Feb 18, 2026', courses: 1, lastActive: '1 day ago' },
  { id: 4, name: 'Sneha Gupta', email: 'sneha.gupta@email.com', phone: '+91 65432 10987', status: 'blocked', joinedDate: 'Mar 5, 2026', courses: 4, lastActive: '7 days ago' },
  { id: 5, name: 'Vikram Singh', email: 'vikram.singh@email.com', phone: '+91 54321 09876', status: 'active', joinedDate: 'Mar 12, 2026', courses: 2, lastActive: '3 days ago' },
  { id: 6, name: 'Ananya Reddy', email: 'ananya.reddy@email.com', phone: '+91 43210 98765', status: 'active', joinedDate: 'Mar 28, 2026', courses: 1, lastActive: '1 week ago' },
  { id: 7, name: 'Arjun Mehta', email: 'arjun.mehta@email.com', phone: '+91 32109 87654', status: 'active', joinedDate: 'Apr 8, 2026', courses: 3, lastActive: '4 hours ago' },
  { id: 8, name: 'Kavya Nair', email: 'kavya.nair@email.com', phone: '+91 21098 76543', status: 'blocked', joinedDate: 'Apr 15, 2026', courses: 0, lastActive: '2 weeks ago' },
  { id: 9, name: 'Rahul Verma', email: 'rahul.verma@email.com', phone: '+91 10987 65432', status: 'active', joinedDate: 'May 1, 2026', courses: 2, lastActive: '1 hour ago' },
  { id: 10, name: 'Meera Joshi', email: 'meera.joshi@email.com', phone: '+91 09876 54321', status: 'active', joinedDate: 'May 20, 2026', courses: 1, lastActive: '30 min ago' },
]

// ─── Students Page ──────────────────────────────────────────────────────────────
export function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const activeCount = students.filter((s) => s.status === 'active').length
  const totalCourses = students.reduce((sum, s) => sum + s.courses, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground mt-1">Manage and track your student enrollment</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="size-4" />
            Export
          </Button>
          <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Plus className="size-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-foreground">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <UserCheck className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold text-foreground">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <GraduationCap className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Course Enrollments</p>
                <p className="text-2xl font-bold text-foreground">{totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="size-4" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">NAME</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell">EMAIL</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">PHONE</TableHead>
                <TableHead className="font-semibold">STATUS</TableHead>
                <TableHead className="font-semibold hidden lg:table-cell">JOINED DATE</TableHead>
                <TableHead className="text-right font-semibold">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-purple-100 flex items-center justify-center text-xs font-semibold text-purple-700 shrink-0">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{student.name}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{student.email}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <GraduationCap className="size-3" />
                          {student.courses} course{student.courses !== 1 ? 's' : ''} &middot; {student.lastActive}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="size-3.5" />
                      {student.email}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="size-3.5" />
                      {student.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs border-0 ${
                        student.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-red-100 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {student.status === 'active' ? (
                        <><UserCheck className="size-3 mr-1" /> Active</>
                      ) : (
                        <><UserX className="size-3 mr-1" /> Blocked</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {student.joinedDate}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 cursor-pointer"><Eye className="size-4" /> View Details</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer"><Edit3 className="size-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {student.status === 'active' ? (
                          <DropdownMenuItem className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                            <ShieldOff className="size-4" /> Block Student
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50">
                            <Shield className="size-4" /> Unblock Student
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No students found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Table Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {filteredStudents.length} of {students.length} students</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled className="h-7 text-xs">Previous</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs">Next</Button>
        </div>
      </div>
    </div>
  )
}

export default StudentsPage
