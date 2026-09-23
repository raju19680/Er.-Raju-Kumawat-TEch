'use client'

import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  MoreVertical,
  BookOpen,
  FileText,
  Settings,
  Pencil,
  Trash2,
  ChevronLeft,
  ArrowUpRight,
  ClipboardList,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Download
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

// Interfaces
interface TestSeries {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  price: number
  mrp: number | null
  category: string | null
  status: 'published' | 'draft'
  _count?: { tests: number }
}

interface Test {
  id: string
  title: string
  instructions: string | null
  status: 'free' | 'paid'
  isLive: boolean
  isLocked: boolean
  numberOfQuestions: number
  totalMarks: number
  totalDuration: number
  uiType: string
}

interface Question {
  id: string
  type: string
  title: string
  option1: string | null
  option2: string | null
  option3: string | null
  option4: string | null
  correctOption: string | null
  positiveMarks: number
  negativeMarks: number
  section: string | null
  solutionText: string | null
}

export default function TestSeriesPage() {
  const [view, setView] = useState<'list' | 'test-detail' | 'question-editor'>('list')
  const [selectedSeries, setSelectedSeries] = useState<TestSeries | null>(null)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)

  // State
  const [seriesList, setSeriesList] = useState<TestSeries[]>([])
  const [loading, setLoading] = useState(true)
  
  const [tests, setTests] = useState<Test[]>([])
  const [loadingTests, setLoadingTests] = useState(false)
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  // Series Dialog State
  const [isSeriesDialogOpen, setIsSeriesDialogOpen] = useState(false)
  const [editingSeries, setEditingSeries] = useState<Partial<TestSeries>>({
    status: 'draft',
    price: 0,
    mrp: 0
  })

  // Test Dialog State
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [editingTest, setEditingTest] = useState<Partial<Test>>({
    status: 'paid',
    isLive: false,
    isLocked: false,
    numberOfQuestions: 0,
    totalMarks: 0,
    totalDuration: 60,
    uiType: 'MCQ'
  })

  // Fetch initial data
  useEffect(() => {
    fetchSeries()
  }, [])

  async function fetchSeries() {
    setLoading(true)
    try {
      const res = await fetch('/api/teacher/test-series')
      if (res.ok) {
        const data = await res.json()
        setSeriesList(data.items || data)
      } else {
        toast.error('Failed to load test series')
      }
    } catch (error) {
      toast.error('Failed to load test series')
    }
    setLoading(false)
  }

  async function fetchTests(seriesId: string) {
    setLoadingTests(true)
    try {
      const res = await fetch(`/api/teacher/tests?testSeriesId=${seriesId}`)
      if (res.ok) {
        const data = await res.json()
        setTests(data.items || data)
      } else {
        toast.error('Failed to load tests')
      }
    } catch (error) {
      toast.error('Failed to load tests')
    }
    setLoadingTests(false)
  }

  const fetchQuestions = async (testId: string) => {
    setLoadingQuestions(true)
    try {
      const res = await fetch(`/api/teacher/questions?testId=${testId}`)
      if (res.ok) {
        const data = await res.json()
        setQuestions(data.items || data)
      } else {
        toast.error('Failed to load questions')
      }
    } catch (error) {
      toast.error('Failed to load questions')
    }
    setLoadingQuestions(false)
  }

  const handleSaveSeries = async () => {
    try {
      const res = await fetch('/api/teacher/test-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSeries)
      })
      if (res.ok) {
        toast.success('Test series saved')
        setIsSeriesDialogOpen(false)
        fetchSeries()
        setEditingSeries({ status: 'draft', price: 0, mrp: 0 })
      } else {
        toast.error('Failed to save test series')
      }
    } catch (error) {
      toast.error('Error saving test series')
    }
  }

  const handleSaveTest = async () => {
    if (!selectedSeries) return
    try {
      const res = await fetch('/api/teacher/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingTest, testSeriesId: selectedSeries.id })
      })
      if (res.ok) {
        toast.success('Test saved')
        setIsTestDialogOpen(false)
        fetchTests(selectedSeries.id)
        setEditingTest({
          status: 'paid',
          isLive: false,
          isLocked: false,
          totalMarks: 0,
          totalDuration: 60,
          uiType: 'MCQ'
        })
      } else {
        toast.error('Failed to save test')
      }
    } catch (error) {
      toast.error('Error saving test')
    }
  }

  const handleDeleteTest = async (id: string) => {
    // API not explicitly listed but assumed DELETE /api/teacher/tests
    toast.info('Delete API not configured in instructions. Id: ' + id)
  }

  const renderSeriesList = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Test Series</h2>
          <p className="text-muted-foreground">Manage your test series and packages</p>
        </div>
        <Button onClick={() => {
          setEditingSeries({ status: 'draft', price: 0, mrp: 0 })
          setIsSeriesDialogOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" /> New Test Series
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Series</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seriesList.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search series..." className="pl-8" />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[280px] rounded-xl" />)}
        </div>
      ) : seriesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No test series found</h3>
          <p className="text-muted-foreground mb-4">Create your first test series to get started.</p>
          <Button onClick={() => setIsSeriesDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Test Series
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {seriesList.map((series) => (
            <Card key={series.id} className="overflow-hidden flex flex-col">
              <div className="aspect-video bg-muted relative">
                {series.thumbnail ? (
                  <img src={series.thumbnail} alt={series.title} className="object-cover w-full h-full" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <BookOpen className="h-11 w-11 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge variant={series.status === 'published' ? 'default' : 'secondary'}>
                    {series.status === 'published' ? 'Published' : 'Draft'}
                  </Badge>
                  {series.category && <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">{series.category}</Badge>}
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg line-clamp-1">{series.title}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {series.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 mt-auto">
                <div className="flex justify-between items-center text-sm mb-4">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-semibold text-primary">
                      {series.price === 0 ? 'Free' : `₹${series.price}`}
                      {series.mrp && series.mrp > series.price && (
                        <span className="text-xs line-through text-muted-foreground ml-1">₹{series.mrp}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground">Tests</span>
                    <span className="font-semibold">{series._count?.tests || 0}</span>
                  </div>
                </div>
                <div className="flex gap-2 w-full">
                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={() => {
                      setSelectedSeries(series)
                      fetchTests(series.id)
                      setView('test-detail')
                    }}
                  >
                    View Tests
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditingSeries(series)
                        setIsSeriesDialogOpen(true)
                      }}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isSeriesDialogOpen} onOpenChange={setIsSeriesDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingSeries.id ? 'Edit Test Series' : 'Create Test Series'}</DialogTitle>
            <DialogDescription>
              Fill in the details for this test series package.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input 
                value={editingSeries.title || ''} 
                onChange={e => setEditingSeries({...editingSeries, title: e.target.value})} 
                placeholder="e.g. Complete JEE Physics 2024"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea 
                value={editingSeries.description || ''} 
                onChange={e => setEditingSeries({...editingSeries, description: e.target.value})}
                placeholder="Describe what's included..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={editingSeries.category || ''} onValueChange={v => setEditingSeries({...editingSeries, category: v})}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Math">Math</SelectItem>
                    <SelectItem value="Biology">Biology</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={editingSeries.status || 'draft'} onValueChange={(v: 'published'|'draft') => setEditingSeries({...editingSeries, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Selling Price (₹)</Label>
                <Input 
                  type="number"
                  value={editingSeries.price || ''} 
                  onChange={e => setEditingSeries({...editingSeries, price: Number(e.target.value)})} 
                />
              </div>
              <div className="grid gap-2">
                <Label>MRP (₹) [Optional]</Label>
                <Input 
                  type="number"
                  value={editingSeries.mrp || ''} 
                  onChange={e => setEditingSeries({...editingSeries, mrp: Number(e.target.value)})} 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSeriesDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSeries}>Save Series</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  const renderTestDetail = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setView('list')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{selectedSeries?.title}</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            Test Series Details <Badge variant="secondary" className="ml-2">{tests.length} Tests</Badge>
          </p>
        </div>
        <div className="ml-auto">
          <Button onClick={() => {
            setEditingTest({
              status: 'paid',
              isLive: false,
              isLocked: false,
              numberOfQuestions: 0,
              totalMarks: 0,
              totalDuration: 60,
              uiType: 'MCQ'
            })
            setIsTestDialogOpen(true)
          }}>
            <Plus className="mr-2 h-4 w-4" /> Add Test
          </Button>
        </div>
      </div>

      <Card>
        <div className="rounded-md border border-b-0 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Title & Type</TableHead>
                <TableHead>Metrics</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTests ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">Loading tests...</TableCell>
                </TableRow>
              ) : tests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No tests added yet. Click "Add Test" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>
                      <div className="font-medium text-base">{test.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{test.uiType}</Badge>
                        <Badge variant={test.status === 'free' ? 'secondary' : 'default'} className="text-xs">
                          {test.status === 'free' ? 'Free' : 'Paid'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm text-muted-foreground gap-1">
                        <span className="flex items-center gap-1"><FileQuestion className="h-3.5 w-3.5" /> {test.numberOfQuestions} Questions</span>
                        <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {test.totalMarks} Marks / {test.totalDuration} mins</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <Badge variant={test.isLive ? "default" : "secondary"} className={test.isLive ? "bg-green-600 hover:bg-green-700 w-fit" : "w-fit"}>
                          {test.isLive ? 'Live' : 'Draft'}
                        </Badge>
                        {test.isLocked && <Badge variant="outline" className="w-fit border-amber-500 text-amber-600">Locked</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => {
                          setSelectedTest(test)
                          fetchQuestions(test.id)
                          setView('question-editor')
                        }}>
                          Add / Edit Questions
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingTest(test)
                              setIsTestDialogOpen(true)
                            }}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-600" onClick={() => handleDeleteTest(test.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingTest.id ? 'Edit Test' : 'Create New Test'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="grid gap-4 py-4 pr-4">
              <div className="grid gap-2">
                <Label>Test Title <span className="text-red-500">*</span></Label>
                <Input 
                  value={editingTest.title || ''} 
                  onChange={e => setEditingTest({...editingTest, title: e.target.value})} 
                  placeholder="e.g. Mechanics Full Test 1"
                />
              </div>
              <div className="grid gap-2">
                <Label>Instructions</Label>
                <Textarea 
                  value={editingTest.instructions || ''} 
                  onChange={e => setEditingTest({...editingTest, instructions: e.target.value})}
                  placeholder="Test specific instructions..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>UI Type</Label>
                  <Select value={editingTest.uiType || 'MCQ'} onValueChange={v => setEditingTest({...editingTest, uiType: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MCQ">Standard MCQ format</SelectItem>
                      <SelectItem value="PDF">PDF Based Test</SelectItem>
                      <SelectItem value="Subjective">Subjective format</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Payment Type</Label>
                  <Select value={editingTest.status || 'paid'} onValueChange={(v: 'free'|'paid') => setEditingTest({...editingTest, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free Test</SelectItem>
                      <SelectItem value="paid">Paid (Requires Series Purchase)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Total Duration (Mins)</Label>
                  <Input 
                    type="number"
                    value={editingTest.totalDuration || ''} 
                    onChange={e => setEditingTest({...editingTest, totalDuration: Number(e.target.value)})} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Total Marks</Label>
                  <Input 
                    type="number"
                    value={editingTest.totalMarks || ''} 
                    onChange={e => setEditingTest({...editingTest, totalMarks: Number(e.target.value)})} 
                  />
                </div>
              </div>
              
              <Separator />
              <h4 className="text-sm font-medium">Toggles</h4>
              <div className="grid gap-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="live-toggle" className="flex flex-col space-y-1">
                    <span>Is Live</span>
                    <span className="font-normal text-xs text-muted-foreground">Make this test visible to students</span>
                  </Label>
                  <Switch 
                    id="live-toggle" 
                    checked={editingTest.isLive} 
                    onCheckedChange={v => setEditingTest({...editingTest, isLive: v})} 
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="lock-toggle" className="flex flex-col space-y-1">
                    <span>Is Locked</span>
                    <span className="font-normal text-xs text-muted-foreground">Prevent attempts until unlocked</span>
                  </Label>
                  <Switch 
                    id="lock-toggle" 
                    checked={editingTest.isLocked} 
                    onCheckedChange={v => setEditingTest({...editingTest, isLocked: v})} 
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTest}>Save Test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  const [questionType, setQuestionType] = useState('mcq')
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question>>({
    positiveMarks: 1,
    negativeMarks: 0,
    type: 'mcq'
  })
  
  const [bulkCsv, setBulkCsv] = useState('')
  const [bulkUploading, setBulkUploading] = useState(false)

  const handleSaveQuestion = async () => {
    if (!selectedTest) return
    try {
      const res = await fetch('/api/teacher/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingQuestion, type: questionType, testId: selectedTest.id })
      })
      if (res.ok) {
        toast.success('Question added')
        fetchQuestions(selectedTest.id)
        // Reset form
        setEditingQuestion({
          positiveMarks: 1,
          negativeMarks: 0,
          type: questionType
        })
      } else {
        toast.error('Failed to add question')
      }
    } catch (error) {
      toast.error('Error adding question')
    }
  }

  const handleBulkUpload = async () => {
    if (!selectedTest) return
    if (!bulkCsv.trim()) {
      toast.error('Please paste CSV content')
      return
    }
    
    setBulkUploading(true)
    
    // Very basic CSV parsing for demo
    const lines = bulkCsv.trim().split('\n')
    const headers = lines[0].split(',')
    
    const parsedQuestions = lines.slice(1).map(line => {
      const values = line.split(',')
      const q: any = {}
      headers.forEach((header, i) => {
        if (values[i] && values[i].trim() !== '') {
          q[header.trim()] = header.includes('Marks') ? Number(values[i].trim()) : values[i].trim()
        }
      })
      return q
    })

    try {
      const res = await fetch('/api/teacher/questions/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: selectedTest.id, questions: parsedQuestions })
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Successfully uploaded ${data.created} questions`)
        setBulkCsv('')
        fetchQuestions(selectedTest.id)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to upload questions')
      }
    } catch (error) {
      toast.error('Error in bulk upload')
    }
    setBulkUploading(false)
  }

  const downloadTemplate = () => {
    const template = 'type,title,option1,option2,option3,option4,correctOption,positiveMarks,negativeMarks,section,solutionText\nmcq,What is 2+2?,1,2,3,4,4,4,1,Math,Basic arithmetic'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'questions_template.csv'
    a.click()
  }

  const renderQuestionEditor = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setView('test-detail')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{selectedTest?.title}</h2>
          <p className="text-muted-foreground">Manage questions for this test</p>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list">Questions List ({questions.length})</TabsTrigger>
          <TabsTrigger value="add">Add Question</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {loadingQuestions ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center p-12 border border-dashed rounded-lg">
              <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No questions yet</h3>
              <p className="text-muted-foreground">Add questions manually or use bulk upload.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <Card key={q.id}>
                  <CardHeader className="py-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-muted-foreground">Q{idx + 1}.</span>
                          <Badge variant="outline">{q.type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            Marks: +{q.positiveMarks} / -{q.negativeMarks}
                          </span>
                        </div>
                        <p className="font-medium text-base mt-2">{q.title}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  {q.type === 'mcq' && (
                    <CardContent className="py-0 pb-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className={`p-2 rounded border ${q.correctOption === '1' ? 'bg-green-50 border-green-200' : ''}`}>A) {q.option1}</div>
                        <div className={`p-2 rounded border ${q.correctOption === '2' ? 'bg-green-50 border-green-200' : ''}`}>B) {q.option2}</div>
                        <div className={`p-2 rounded border ${q.correctOption === '3' ? 'bg-green-50 border-green-200' : ''}`}>C) {q.option3}</div>
                        <div className={`p-2 rounded border ${q.correctOption === '4' ? 'bg-green-50 border-green-200' : ''}`}>D) {q.option4}</div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Question Type</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['mcq', 'multiple_correct', 'true_false', 'numerical', 'subjective'].map(t => (
                    <Button 
                      key={t}
                      variant={questionType === t ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setQuestionType(t)}
                    >
                      {t.replace('_', ' ').toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Question Text</Label>
                <Textarea 
                  value={editingQuestion.title || ''}
                  onChange={e => setEditingQuestion({...editingQuestion, title: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>

              {(questionType === 'mcq' || questionType === 'multiple_correct') && (
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(num => (
                    <div key={num} className="grid gap-2">
                      <Label>Option {num}</Label>
                      <Input 
                        value={(editingQuestion as any)[`option${num}`] || ''}
                        onChange={e => setEditingQuestion({...editingQuestion, [`option${num}`]: e.target.value})}
                      />
                    </div>
                  ))}
                  <div className="grid gap-2 md:col-span-2 mt-2">
                    <Label>Correct Option(s) (e.g. 1 or 1,3)</Label>
                    <Input 
                      value={editingQuestion.correctOption || ''}
                      onChange={e => setEditingQuestion({...editingQuestion, correctOption: e.target.value})}
                      placeholder="Enter correct option numbers..."
                    />
                  </div>
                </div>
              )}

              {questionType === 'true_false' && (
                <div className="grid gap-2">
                  <Label>Correct Answer</Label>
                  <Select value={editingQuestion.correctOption || ''} onValueChange={v => setEditingQuestion({...editingQuestion, correctOption: v})}>
                    <SelectTrigger className="max-w-[200px]"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Section (Optional)</Label>
                  <Input 
                    value={editingQuestion.section || ''}
                    onChange={e => setEditingQuestion({...editingQuestion, section: e.target.value})}
                    placeholder="e.g. Physics Section A"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Positive Marks</Label>
                  <Input 
                    type="number"
                    value={editingQuestion.positiveMarks || 1}
                    onChange={e => setEditingQuestion({...editingQuestion, positiveMarks: Number(e.target.value)})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Negative Marks</Label>
                  <Input 
                    type="number"
                    value={editingQuestion.negativeMarks || 0}
                    onChange={e => setEditingQuestion({...editingQuestion, negativeMarks: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Solution Text / Explanation (Optional)</Label>
                <Textarea 
                  value={editingQuestion.solutionText || ''}
                  onChange={e => setEditingQuestion({...editingQuestion, solutionText: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t p-4 bg-muted/20">
              <Button variant="outline" onClick={() => setEditingQuestion({ positiveMarks: 1, negativeMarks: 0 })}>Clear Form</Button>
              <Button onClick={handleSaveQuestion}>Save Question</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload Questions</CardTitle>
              <CardDescription>
                Upload multiple questions at once using a CSV format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-lg text-blue-800">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">
                  Format required: <code className="font-semibold px-1">type,title,option1,option2,option3,option4,correctOption,positiveMarks,negativeMarks,section,solutionText</code>
                  <br />
                  Supported types: mcq, numerical, subjective, true_false
                </p>
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="ml-auto bg-white">
                  <Download className="mr-2 h-4 w-4" /> Template
                </Button>
              </div>

              <div className="grid gap-2">
                <Label>Paste CSV Data Here</Label>
                <Textarea 
                  className="font-mono text-sm min-h-80"
                  placeholder="type,title,option1,option2,option3,option4,correctOption,positiveMarks,negativeMarks,section,solutionText
mcq,What is the capital of France?,London,Berlin,Paris,Madrid,3,4,1,GK,Paris is the capital of France."
                  value={bulkCsv}
                  onChange={(e) => setBulkCsv(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t p-4 flex justify-between bg-muted/20">
              <div className="text-sm text-muted-foreground">
                First row must be headers.
              </div>
              <Button onClick={handleBulkUpload} disabled={bulkUploading || !bulkCsv.trim()}>
                {bulkUploading ? 'Uploading...' : 'Upload Questions'} <UploadCloud className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)]">
      {view === 'list' && renderSeriesList()}
      {view === 'test-detail' && renderTestDetail()}
      {view === 'question-editor' && renderQuestionEditor()}
    </div>
  )
}
