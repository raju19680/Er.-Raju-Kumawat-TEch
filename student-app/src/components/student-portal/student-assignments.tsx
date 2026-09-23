'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { apiFetchJSON } from '@/lib/api-client'
import { UploadCloud, FileText, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface Assignment {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  totalMarks: number
  course: { title: string }
  submissions: any[]
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null)
  
  const [submissionText, setSubmissionText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function loadAssignments() {
    setLoading(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; data: Assignment[] }>('/api/student/assignments')
      if (res.success) setAssignments(res.data)
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

  const handleSubmit = async () => {
    if (!activeAssignment || !submissionText.trim()) return toast.error('Submission text is required')
    setIsSubmitting(true)
    try {
      const res = await apiFetchJSON('/api/student/assignments/submit', {
        method: 'POST',
        body: JSON.stringify({
          assignmentId: activeAssignment.id,
          content: submissionText
        })
      })
      toast.success('Assignment submitted successfully!')
      setSubmissionText('')
      setActiveAssignment(null)
      loadAssignments()
    } catch (err) {
      toast.error('Failed to submit assignment')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="py-20 text-center">Loading assignments...</div>

  if (activeAssignment) {
    const existingSubmission = activeAssignment.submissions?.[0]
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setActiveAssignment(null)} className="mb-4">← Back to List</Button>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <Badge variant="outline">{activeAssignment.course.title}</Badge>
              <span className="text-sm font-medium">{activeAssignment.totalMarks} Marks</span>
            </div>
            <CardTitle className="text-2xl mt-2">{activeAssignment.title}</CardTitle>
            {activeAssignment.dueDate && (
              <p className="text-sm text-red-600 font-medium flex items-center gap-1 mt-2">
                <Clock className="w-4 h-4" /> Due: {new Date(activeAssignment.dueDate).toLocaleString()}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none mb-6 p-4 bg-slate-50 rounded-lg text-sm whitespace-pre-wrap">
              {activeAssignment.description || 'No additional instructions.'}
            </div>

            {existingSubmission ? (
              <div className="border border-green-200 bg-green-50 rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-green-900 text-lg">Assignment Submitted</h3>
                <p className="text-sm text-green-700 mt-1">
                  Status: {existingSubmission.status.toUpperCase()} 
                  {existingSubmission.marksObtained != null && ` | Marks: ${existingSubmission.marksObtained}/${activeAssignment.totalMarks}`}
                </p>
                {existingSubmission.feedback && (
                  <div className="mt-4 p-3 bg-white rounded border text-left text-sm">
                    <strong>Teacher Feedback:</strong>
                    <p className="mt-1 text-muted-foreground">{existingSubmission.feedback}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold">Your Submission</h3>
                <Textarea 
                  placeholder="Type your answer here..."
                  className="min-h-[200px]"
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input type="file" className="pl-10" />
                    <UploadCloud className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">(File upload placeholder)</span>
                </div>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Assignments</h1>
        <p className="text-muted-foreground text-sm">View and submit your pending coursework.</p>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg bg-gray-50">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-semibold">No pending assignments</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map(assignment => {
            const isSubmitted = assignment.submissions?.length > 0
            return (
              <Card key={assignment.id} className="hover:shadow-md cursor-pointer transition-shadow" onClick={() => setActiveAssignment(assignment)}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant={isSubmitted ? "secondary" : "default"} className={isSubmitted ? "bg-green-100 text-green-700" : ""}>
                      {isSubmitted ? 'Submitted' : 'Pending'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-2 line-clamp-1">{assignment.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                  <p>{assignment.course.title}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
