'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { apiFetchJSON } from '@/lib/api-client'
import { Plus, Search, FileText, CheckCircle, Clock, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'

interface Submission {
  id: string
  studentId: string
  content: string | null
  status: string
  marksObtained: number | null
  feedback: string | null
  submittedAt: string
  student: { name: string; email: string }
}

interface Assignment {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  totalMarks: number
  courseId: string
  course: { title: string }
  _count: { submissions: number }
  submissions?: Submission[]
}

export default function AssignmentManager() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  
  // Grade state
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null)
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null)
  const [marks, setMarks] = useState('')
  const [feedback, setFeedback] = useState('')
  
  // New assignment form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [totalMarks, setTotalMarks] = useState(100)
  const [courseId, setCourseId] = useState('') 

  async function loadAssignments() {
    setLoading(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; data: Assignment[] }>('/api/teacher/assignments')
      if (res.success) {
        setAssignments(res.data)
      }
    } catch (err) {
      toast.error('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAssignments()
  }, [])

  const handleCreate = async () => {
    if (!title || !courseId) return toast.error('Title and Course ID are required')
    try {
      const res = await apiFetchJSON<{ success: boolean; data: Assignment }>('/api/teacher/assignments', {
        method: 'POST',
        body: JSON.stringify({ title, description, totalMarks, courseId })
      })
      if (res.success) {
        toast.success('Assignment created')
        setCreateOpen(false)
        loadAssignments()
        setTitle(''); setDescription(''); setCourseId('')
      }
    } catch (err) {
      toast.error('Failed to create assignment')
    }
  }

  const handleGrade = async () => {
    if (!activeSubmission) return
    try {
      const res = await apiFetchJSON('/api/teacher/assignments/grade', {
        method: 'POST',
        body: JSON.stringify({
          submissionId: activeSubmission.id,
          marksObtained: Number(marks),
          feedback
        })
      })
      toast.success('Graded successfully')
      
      // Update local state
      setActiveSubmission(prev => prev ? { ...prev, marksObtained: Number(marks), feedback, status: 'graded' } : null)
      setActiveAssignment(prev => {
        if (!prev) return null
        return {
          ...prev,
          submissions: prev.submissions?.map(s => s.id === activeSubmission.id ? { ...s, marksObtained: Number(marks), feedback, status: 'graded' } : s)
        }
      })
    } catch (err) {
      toast.error('Failed to grade')
    }
  }

  const filtered = assignments.filter(a => a.title.toLowerCase().includes(search.toLowerCase()))

  if (activeAssignment) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setActiveAssignment(null)} className="gap-2 mb-2">
          <ChevronLeft className="w-4 h-4" /> Back to Assignments
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{activeAssignment.title}</h1>
            <p className="text-muted-foreground">{activeAssignment.course.title} • {activeAssignment.totalMarks} Total Marks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 border rounded-lg overflow-hidden bg-white">
            <div className="p-4 bg-muted/50 font-semibold border-b">Submissions</div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {!activeAssignment.submissions || activeAssignment.submissions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No submissions yet</div>
              ) : (
                activeAssignment.submissions.map(sub => (
                  <div 
                    key={sub.id} 
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors \${activeSubmission?.id === sub.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''}`}
                    onClick={() => {
                      setActiveSubmission(sub)
                      setMarks(sub.marksObtained?.toString() || '')
                      setFeedback(sub.feedback || '')
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">Student ID: {sub.studentId.substring(0,8)}...</p>
                      <Badge variant={sub.status === 'graded' ? 'default' : 'secondary'} className="text-xs uppercase">
                        {sub.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {activeSubmission ? (
              <Card>
                <CardHeader className="bg-muted/30 border-b">
                  <CardTitle className="text-lg">Student Submission</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="p-4 bg-slate-50 rounded-lg whitespace-pre-wrap text-sm border font-mono">
                    {activeSubmission.content || 'No text submitted.'}
                  </div>
                  
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="font-semibold text-lg">Grading</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Marks Obtained (out of {activeAssignment.totalMarks})</label>
                        <Input type="number" value={marks} onChange={(e) => setMarks(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Feedback (Optional)</label>
                      <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Great job..." />
                    </div>
                    <Button onClick={handleGrade} className="w-full sm:w-auto">Save Grade</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full min-h-[400px] flex items-center justify-center border border-dashed rounded-lg text-muted-foreground">
                Select a submission from the list to start grading
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assignment Management</h1>
          <p className="text-sm text-muted-foreground">Create assignments and grade student submissions.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Assignment
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search assignments..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold text-lg">No assignments found</h3>
          <p className="text-sm text-muted-foreground mt-1">Create your first assignment to start evaluating students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(assignment => (
            <Card key={assignment.id} className="hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveAssignment(assignment)}>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="mb-2 bg-indigo-50 text-indigo-700 border-indigo-200">
                    {assignment.course.title}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground">
                    {assignment.totalMarks} Marks
                  </span>
                </div>
                <CardTitle className="text-lg line-clamp-1">{assignment.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 flex flex-col gap-3">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                  {assignment.description || 'No description provided.'}
                </p>
                <div className="flex items-center gap-4 text-sm mt-2">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    <span>{assignment._count.submissions} Submissions</span>
                  </div>
                  {assignment.dueDate && (
                    <div className="flex items-center gap-1.5 text-orange-600 font-medium">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assignment Title</label>
              <Input placeholder="e.g. Chapter 1 Final Project" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Course ID (Temp input)</label>
              <Input placeholder="Enter course UUID" value={courseId} onChange={e => setCourseId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Marks</label>
              <Input type="number" value={totalMarks} onChange={e => setTotalMarks(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description & Instructions</label>
              <Textarea 
                placeholder="What should students do?" 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
