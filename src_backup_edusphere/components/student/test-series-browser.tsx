'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Search, ClipboardList, ListChecks, Users, Loader2, CheckCircle2, Clock, ChevronLeft, Play, Award, XCircle, Lock } from 'lucide-react'

interface CatalogTestSeries {
  id: string
  title: string
  description: string
  price: number
  category: string | null
  totalTests: number
  teacher: { id: string; name: string | null; username: string; avatar: string | null }
  _count: { tests: number; purchases: number }
  isPurchased: boolean
}

interface TestDetail {
  test: {
    id: string
    title: string
    description: string | null
    duration: number
    totalMarks: number
    passingMarks: number
    testSeries: { id: string; title: string; price: number }
    questions: { id: string; text: string; options: string[]; marks: number }[]
  }
  attempts: {
    id: string
    score: number
    totalMarks: number
    percentage: number
    passed: boolean
    timeTaken: number
    attemptedAt: string
  }[]
}

export function TestSeriesBrowser() {
  const [testSeries, setTestSeries] = useState<CatalogTestSeries[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [buyingId, setBuyingId] = useState<string | null>(null)
  
  // Test detail view
  const [selectedSeries, setSelectedSeries] = useState<CatalogTestSeries | null>(null)
  const [tests, setTests] = useState<{ id: string; title: string; description: string | null; duration: number; _count: { questions: number; attempts: number } }[]>([])
  const [testsLoading, setTestsLoading] = useState(false)
  
  // Test taking view
  const [takingTestId, setTakingTestId] = useState<string | null>(null)
  const [testDetail, setTestDetail] = useState<TestDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; totalMarks: number; percentage: number; passed: boolean } | null>(null)

  const fetchTestSeries = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    const res = await fetch(`/api/catalog/tests?${params}`)
    const data = await res.json()
    setTestSeries(data.testSeries || [])
    setCategories(data.categories || [])
    setLoading(false)
  }

  const fetchTests = async (seriesId: string) => {
    setTestsLoading(true)
    const res = await fetch(`/api/teacher/tests/${seriesId}`)
    const data = await res.json()
    setTests(data.testSeries?.tests || [])
    setTestsLoading(false)
  }

  const fetchTestDetail = async (testId: string) => {
    setDetailLoading(true)
    const res = await fetch(`/api/tests/${testId}`)
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setDetailLoading(false); return }
    setTestDetail(data)
    setTimeLeft(data.test.duration * 60)
    setAnswers({})
    setResult(null)
    setDetailLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(fetchTestSeries, 300)
    return () => clearTimeout(timer)
  }, [search, category])

  useEffect(() => { if (selectedSeries) fetchTests(selectedSeries.id) }, [selectedSeries])
  useEffect(() => { if (takingTestId) fetchTestDetail(takingTestId) }, [takingTestId])

  useEffect(() => {
    if (takingTestId && timeLeft > 0 && !result) {
      const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
      return () => clearInterval(timer)
    }
    if (takingTestId && timeLeft === 0 && !result && testDetail) {
      handleSubmit()
    }
  }, [takingTestId, timeLeft, result])

  const handlePurchase = async (seriesId: string) => {
    setBuyingId(seriesId)
    try {
      const res = await fetch('/api/student/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'TEST_SERIES', itemId: seriesId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Purchased successfully! 🎉')
      fetchTestSeries()
    } finally { setBuyingId(null) }
  }

  const handleSubmit = async () => {
    if (!testDetail || !takingTestId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/student/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: takingTestId, answers, timeTaken: testDetail.test.duration * 60 - timeLeft }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setResult({ score: data.attempt.score, totalMarks: data.attempt.totalMarks, percentage: data.attempt.percentage, passed: data.attempt.passed })
      toast.success('Test submitted!')
    } finally { setSubmitting(false) }
  }

  const formatTime = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2, '0')}`

  // Test taking view
  if (takingTestId && testDetail) {
    if (detailLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
    
    if (result) {
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className={`text-white border-0 ${result.passed ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-red-600'}`}>
            <CardContent className="p-8 text-center">
              {result.passed ? <Award className="w-16 h-16 mx-auto mb-3" /> : <XCircle className="w-16 h-16 mx-auto mb-3" />}
              <h2 className="text-3xl font-bold mb-2">{result.passed ? 'Congratulations! 🎉' : 'Keep Practicing'}</h2>
              <p className="text-white/90 mb-4">{result.passed ? 'You passed the test!' : 'You did not meet the passing marks'}</p>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div><p className="text-3xl font-bold">{result.score}</p><p className="text-sm text-white/80">Score</p></div>
                <div><p className="text-3xl font-bold">{result.totalMarks}</p><p className="text-sm text-white/80">Total Marks</p></div>
                <div><p className="text-3xl font-bold">{result.percentage.toFixed(1)}%</p><p className="text-sm text-white/80">Percentage</p></div>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setTakingTestId(null); setTestDetail(null); setResult(null) }}><ChevronLeft className="w-4 h-4 mr-2" /> Back to Tests</Button>
            <Button onClick={() => { setResult(null); setAnswers({}); setTimeLeft(testDetail.test.duration * 60) }} className="bg-emerald-600 hover:bg-emerald-700"><Play className="w-4 h-4 mr-2" /> Retake Test</Button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between sticky top-16 z-20 bg-background/80 backdrop-blur-sm py-3 border-b">
          <div>
            <h2 className="font-bold">{testDetail.test.title}</h2>
            <p className="text-xs text-muted-foreground">{Object.keys(answers).length} of {testDetail.test.questions.length} answered</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold ${timeLeft < 60 ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-muted'}`}>
              <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
            </div>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Submit
            </Button>
          </div>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          {testDetail.test.questions.map((q, idx) => (
            <Card key={q.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 font-semibold shrink-0">{idx + 1}</div>
                  <p className="font-medium flex-1">{q.text}</p>
                  <Badge variant="outline" className="shrink-0">{q.marks} marks</Badge>
                </div>
                <div className="space-y-2 ml-11">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswers({ ...answers, [q.id]: i })}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                        answers[q.id] === i ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'border-border hover:border-emerald-400'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium shrink-0 ${
                        answers[q.id] === i ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-muted-foreground/40'
                      }`}>{String.fromCharCode(65 + i)}</span>
                      <span className="text-sm">{opt}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Tests within a series view
  if (selectedSeries) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setSelectedSeries(null)} className="-ml-2">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Test Series
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{selectedSeries.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{selectedSeries.description}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="gap-1"><ListChecks className="w-3 h-3" /> {selectedSeries._count.tests} tests</Badge>
            <Badge variant="outline" className="gap-1"><Users className="w-3 h-3" /> {selectedSeries._count.purchases} learners</Badge>
          </div>
        </div>

        {testsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
        ) : tests.length === 0 ? (
          <Card><CardContent className="p-12 text-center"><ListChecks className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">No tests available yet</p></CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tests.map((test, idx) => (
              <Card key={test.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 font-bold">{idx + 1}</div>
                    <Badge variant="outline">{test._count.questions} Qs</Badge>
                  </div>
                  <h3 className="font-semibold mb-1">{test.title}</h3>
                  {test.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{test.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {test.duration} min</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {test._count.attempts} attempts</span>
                  </div>
                  <Button 
                    onClick={() => setTakingTestId(test.id)} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={!selectedSeries.isPurchased && selectedSeries.price > 0}
                  >
                    {selectedSeries.isPurchased || selectedSeries.price === 0 ? <><Play className="w-4 h-4 mr-2" /> Start Test</> : <><Lock className="w-4 h-4 mr-2" /> Purchase to Access</>}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Test series catalog
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Test Series</h2>
        <p className="text-sm text-muted-foreground">Practice with mock tests and quizzes</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search test series..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56" />)}</div>
      ) : testSeries.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">No test series found</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testSeries.map((series) => (
            <Card key={series.id} className="hover:shadow-lg transition-all flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"><ClipboardList className="w-6 h-6 text-white" /></div>
                  {series.isPurchased && <Badge className="bg-emerald-600 gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Owned</Badge>}
                </div>
                <h3 className="font-semibold mb-1 line-clamp-1">{series.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{series.description}</p>
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="w-5 h-5"><AvatarFallback className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">{series.teacher.name?.charAt(0) || 'T'}</AvatarFallback></Avatar>
                  <span className="text-xs text-muted-foreground truncate">{series.teacher.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><ListChecks className="w-3 h-3" /> {series._count.tests} tests</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {series._count.purchases}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-emerald-600">{series.price === 0 ? 'Free' : `₹${series.price}`}</span>
                  {series.isPurchased ? (
                    <Button size="sm" variant="outline" onClick={() => setSelectedSeries(series)}><Play className="w-3.5 h-3.5 mr-1" /> Start</Button>
                  ) : series.price === 0 ? (
                    <Button size="sm" onClick={() => setSelectedSeries(series)} className="bg-emerald-600 hover:bg-emerald-700">Access Free</Button>
                  ) : (
                    <Button size="sm" onClick={() => handlePurchase(series.id)} disabled={buyingId === series.id} className="bg-emerald-600 hover:bg-emerald-700">
                      {buyingId === series.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null} Buy Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


