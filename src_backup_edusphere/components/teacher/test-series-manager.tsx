'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog'
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, 
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { 
  Plus, ClipboardList, Edit, Trash2, Eye, EyeOff, ChevronLeft, FileQuestion, 
  ListChecks, Clock, Users, CheckCircle2, X, GripVertical 
} from 'lucide-react'

interface TestSeries {
  id: string
  title: string
  description: string
  price: number
  category: string | null
  totalTests: number
  isPublished: boolean
  _count: { tests: number; purchases: number }
  createdAt: string
}

interface Test {
  id: string
  title: string
  description: string | null
  duration: number
  totalMarks: number
  passingMarks: number
  order: number
  _count: { questions: number; attempts: number }
}

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
  explanation: string | null
  marks: number
}

export function TestSeriesManager() {
  const [testSeriesList, setTestSeriesList] = useState<TestSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TestSeries | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [selectedSeries, setSelectedSeries] = useState<TestSeries | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [testsLoading, setTestsLoading] = useState(false)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [editingTest, setEditingTest] = useState<Test | null>(null)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  const [form, setForm] = useState({ title: '', description: '', price: '0', category: '' })
  const [testForm, setTestForm] = useState({ title: '', description: '', duration: '60', totalMarks: '100', passingMarks: '40' })
  const [questionForm, setQuestionForm] = useState({ text: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', marks: '1' })

  const fetchSeries = async () => {
    setLoading(true)
    const res = await fetch('/api/teacher/tests')
    const data = await res.json()
    setTestSeriesList(data.testSeries || [])
    setLoading(false)
  }

  const fetchTests = async (seriesId: string) => {
    setTestsLoading(true)
    const res = await fetch(`/api/teacher/tests/${seriesId}`)
    const data = await res.json()
    setTests(data.testSeries?.tests || [])
    setTestsLoading(false)
  }

  const fetchQuestions = async (testId: string) => {
    setQuestionsLoading(true)
    const res = await fetch(`/api/teacher/tests/manage?testId=${testId}`)
    const data = await res.json()
    const parsed = (data.test?.questions || []).map((q: Question & { options: string }) => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
    }))
    setQuestions(parsed)
    setQuestionsLoading(false)
  }

  useEffect(() => { fetchSeries() }, [])
  useEffect(() => { if (selectedSeries) fetchTests(selectedSeries.id) }, [selectedSeries])
  useEffect(() => { if (selectedTest) fetchQuestions(selectedTest.id) }, [selectedTest])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editing ? `/api/teacher/tests/${editing.id}` : '/api/teacher/tests'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(editing ? 'Test series updated' : 'Test series created')
      setDialogOpen(false)
      fetchSeries()
    } finally { setSubmitting(false) }
  }

  const togglePublish = async (series: TestSeries) => {
    const res = await fetch(`/api/teacher/tests/${series.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPublished: !series.isPublished }) })
    if (res.ok) { toast.success(series.isPublished ? 'Unpublished' : 'Published'); fetchSeries() }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await fetch(`/api/teacher/tests/${deleteId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted'); fetchSeries() }
    setDeleteId(null)
  }

  // Test handlers
  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSeries) return
    setSubmitting(true)
    try {
      if (editingTest) {
        toast.info('Test editing will be available soon')
      } else {
        const res = await fetch('/api/teacher/tests/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create-test', testSeriesId: selectedSeries.id, ...testForm }),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error); return }
        toast.success('Test created')
      }
      setTestDialogOpen(false)
      fetchTests(selectedSeries.id)
    } finally { setSubmitting(false) }
  }

  const deleteTest = async (testId: string) => {
    if (!selectedSeries) return
    const res = await fetch(`/api/teacher/tests/manage?testId=${testId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Test deleted'); fetchTests(selectedSeries.id) }
  }

  // Question handlers
  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTest) return
    setSubmitting(true)
    try {
      if (editingQuestion) {
        toast.info('Question editing coming soon')
      } else {
        const res = await fetch('/api/teacher/tests/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create-question', testId: selectedTest.id, ...questionForm }),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error); return }
        toast.success('Question added')
      }
      setQuestionDialogOpen(false)
      setQuestionForm({ text: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', marks: '1' })
      fetchQuestions(selectedTest.id)
    } finally { setSubmitting(false) }
  }

  const deleteQuestion = async (questionId: string) => {
    if (!selectedTest) return
    const res = await fetch(`/api/teacher/tests/manage?questionId=${questionId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Question deleted'); fetchQuestions(selectedTest.id) }
  }

  // Question view
  if (selectedTest) {
    return (
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => setSelectedTest(null)} className="mb-2 -ml-2">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Tests
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{selectedTest.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedTest.duration} min · {selectedTest.totalMarks} marks · Pass: {selectedTest.passingMarks}
              </p>
            </div>
            <Button onClick={() => { setEditingQuestion(null); setQuestionForm({ text: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', marks: '1' }); setQuestionDialogOpen(true) }} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Add Question
            </Button>
          </div>
        </div>

        {questionsLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileQuestion className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-4">No questions yet. Add your first question!</p>
              <Button onClick={() => setQuestionDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" /> Add First Question
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <Card key={q.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 font-semibold text-sm shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-2">{q.text}</p>
                      <div className="space-y-1.5">
                        {q.options.map((opt, i) => (
                          <div key={i} className={`flex items-center gap-2 text-sm p-2 rounded ${
                            i === q.correctAnswer ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium' : 'text-muted-foreground'
                          }`}>
                            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0">
                              {String.fromCharCode(65 + i)}
                            </span>
                            {opt}
                            {i === q.correctAnswer && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                          </div>
                        ))}
                      </div>
                      {q.explanation && <p className="text-xs text-muted-foreground mt-2 italic">💡 {q.explanation}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteQuestion(q.id)} className="text-destructive hover:text-destructive shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Question Dialog */}
        <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
              <DialogDescription>Fill in the question, options, and mark the correct answer</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleQuestionSubmit}>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Question Text *</Label>
                  <Textarea required placeholder="What is the value of..." value={questionForm.text} onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Options * <span className="text-xs text-muted-foreground">(click the circle to mark correct answer)</span></Label>
                  <div className="space-y-2">
                    {questionForm.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuestionForm({ ...questionForm, correctAnswer: i })}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium shrink-0 transition-colors ${
                            questionForm.correctAnswer === i
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-muted-foreground/30 text-muted-foreground hover:border-emerald-400'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </button>
                        <Input
                          required
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...questionForm.options]
                            newOpts[i] = e.target.value
                            setQuestionForm({ ...questionForm, options: newOpts })
                          }}
                          className="flex-1"
                        />
                        {questionForm.options.length > 2 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => {
                            const newOpts = questionForm.options.filter((_, idx) => idx !== i)
                            const newAns = questionForm.correctAnswer > i ? questionForm.correctAnswer - 1 : questionForm.correctAnswer
                            setQuestionForm({ ...questionForm, options: newOpts, correctAnswer: newAns })
                          }}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {questionForm.options.length < 6 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setQuestionForm({ ...questionForm, options: [...questionForm.options, ''] })}>
                      <Plus className="w-3 h-3 mr-1" /> Add Option
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Marks</Label>
                    <Input type="number" min="1" value={questionForm.marks} onChange={(e) => setQuestionForm({ ...questionForm, marks: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Explanation (optional)</Label>
                  <Textarea placeholder="Explain why the correct answer is right..." value={questionForm.explanation} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })} rows={2} />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setQuestionDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? 'Saving...' : editingQuestion ? 'Update' : 'Add Question'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Test list view (within a series)
  if (selectedSeries) {
    return (
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => setSelectedSeries(null)} className="mb-2 -ml-2">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Test Series
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{selectedSeries.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{selectedSeries.description}</p>
            </div>
            <Button onClick={() => { setEditingTest(null); setTestForm({ title: '', description: '', duration: '60', totalMarks: '100', passingMarks: '40' }); setTestDialogOpen(true) }} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Add Test
            </Button>
          </div>
        </div>

        {testsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
        ) : tests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ListChecks className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-4">No tests yet. Add your first test!</p>
              <Button onClick={() => setTestDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" /> Add First Test
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tests.map((test, idx) => (
              <Card key={test.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTest(test)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 font-bold">
                      {idx + 1}
                    </div>
                    <Badge variant="outline">{test._count.questions} Qs</Badge>
                  </div>
                  <h3 className="font-semibold mb-2">{test.title}</h3>
                  {test.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{test.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {test.duration} min</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {test._count.attempts} attempts</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Test Dialog */}
        <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTest ? 'Edit Test' : 'Add New Test'}</DialogTitle>
              <DialogDescription>Create a test within this test series</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTestSubmit}>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Test Title *</Label>
                  <Input required placeholder="Mock Test 1" value={testForm.title} onChange={(e) => setTestForm({ ...testForm, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Test description..." value={testForm.description} onChange={(e) => setTestForm({ ...testForm, description: e.target.value })} rows={2} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Input type="number" min="1" value={testForm.duration} onChange={(e) => setTestForm({ ...testForm, duration: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Marks</Label>
                    <Input type="number" min="1" value={testForm.totalMarks} onChange={(e) => setTestForm({ ...testForm, totalMarks: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pass Marks</Label>
                    <Input type="number" min="1" value={testForm.passingMarks} onChange={(e) => setTestForm({ ...testForm, passingMarks: e.target.value })} />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setTestDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? 'Saving...' : 'Add Test'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Test series list view
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Test Series</h2>
          <p className="text-sm text-muted-foreground mt-1">Create test series with MCQ tests and auto-grading</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ title: '', description: '', price: '0', category: '' }); setDialogOpen(true) }} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Create Test Series
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : testSeriesList.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-4">No test series yet. Create your first one!</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Create First Test Series
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testSeriesList.map((series) => (
            <Card key={series.id} className="hover:shadow-lg transition-all flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  {series.isPublished ? <Badge className="bg-emerald-600">Published</Badge> : <Badge variant="secondary">Draft</Badge>}
                </div>
                <h3 className="font-semibold mb-1 line-clamp-1">{series.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{series.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><ListChecks className="w-3 h-3" /> {series._count.tests} tests</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {series._count.purchases} sold</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-emerald-600">₹{series.price}</span>
                  <Badge variant="outline">{series.category || 'General'}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedSeries(series)}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> Manage
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => togglePublish(series)}>
                    {series.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDeleteId(series.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Series Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Test Series' : 'Create Test Series'}</DialogTitle>
            <DialogDescription>{editing ? 'Update test series details' : 'Create a new test series to sell to students'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input required placeholder="JEE Main Mock Test Series 2025" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea required placeholder="Comprehensive mock tests for JEE preparation..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input placeholder="JEE Main" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this test series?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the test series and all its tests and questions.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
