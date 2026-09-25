const fs = require('fs');
const file = 'h:/Er. Raju Kumawat APP - Copy/src/components/cms/test-portal/question-library.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace("import { toast } from 'sonner'", "import { toast } from 'sonner'\nimport { Checkbox } from '@/components/ui/checkbox'\nimport { CheckCircle } from 'lucide-react'");

// 2. Add state
const oldState = `  // Filter state
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sectionFilter, setSectionFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const limit = 20
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')`;

const newState = `  // Filter state
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sectionFilter, setSectionFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const limit = 20
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Selection state
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [createTestModalOpen, setCreateTestModalOpen] = useState(false)
  const [newTestTitle, setNewTestTitle] = useState('')
  const [newTestSeriesId, setNewTestSeriesId] = useState('')
  const [testSeriesOptions, setTestSeriesOptions] = useState<any[]>([])
  const [isCreatingTest, setIsCreatingTest] = useState(false)

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const res = await apiFetch(\`/api/teacher/test-series\`)
        if (res.ok) {
          const data = await res.json()
          setTestSeriesOptions(data.items || [])
        }
      } catch (e) {
        console.error('Failed to fetch test series')
      }
    }
    fetchSeries()
  }, [])`;
content = content.replace(oldState, newState);

// 3. Add handler
const oldHandler = `  //  Render `;
const newHandler = `  const handleCreateTest = async () => {
    setIsCreatingTest(true)
    try {
      const res = await apiFetch('/api/teacher/tests/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTestTitle,
          testSeriesId: newTestSeriesId,
          questionIds: selectedQuestions
        })
      })

      if (!res.ok) {
        throw new Error('Failed to create test')
      }

      toast.success('Test created successfully with selected questions!')
      setCreateTestModalOpen(false)
      setSelectedQuestions([])
      setNewTestTitle('')
      setNewTestSeriesId('')
    } catch (err: any) {
      toast.error(err.message || 'Error creating test')
    } finally {
      setIsCreatingTest(false)
    }
  }

  //  Render `;
content = content.replace(oldHandler, newHandler);

// 4. Interface update
const oldInterfaceRegex = /interface Question \{.*?\}/s;
const newInterface = `interface Question {
  id: string
  type: string
  heading: string | null
  directive: string | null
  title: string
  image1: string | null
  image2: string | null
  image3: string | null
  option1: string | null
  option2: string | null
  option3: string | null
  option4: string | null
  option5: string | null
  option1Image: string | null
  option2Image: string | null
  option3Image: string | null
  option4Image: string | null
  option5Image: string | null
  correctOption: string | null
  solutionHeading: string | null
  solutionImage1: string | null
  solutionImage2: string | null
  solutionVideo: string | null
  solutionText: string | null
  section: string | null
  positiveMarks: number
  negativeMarks: number
  sortOrder: number
  testId: string
  difficulty: string
}`;
content = content.replace(oldInterfaceRegex, newInterface);

// 5. Replace List render
const oldListRenderRegex = /\{\/\* Questions Display - List View \*\/\}.*?<\/Card>\s*\)\}/s;
const newListRender = `{/* Questions Display - List View */}
        {!loading && !error && questions.length > 0 && viewMode === 'list' && (
          <Card className="rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y">
                {questions.map((question) => (
                  <div key={question.id} className="p-6 flex flex-col md:flex-row justify-between items-start gap-4 hover:bg-gray-50/50 transition-colors relative group">
                    <div className="md:absolute md:left-4 md:top-6 mt-1 md:mt-0">
                      <Checkbox 
                         checked={selectedQuestions.includes(question.id)} 
                         onCheckedChange={(checked) => {
                           if (checked) setSelectedQuestions(prev => [...prev, question.id])
                           else setSelectedQuestions(prev => prev.filter(id => id !== question.id))
                         }}
                      />
                    </div>
                    <div className="flex-1 space-y-3 md:pl-8">
                      <div className="font-medium flex items-start text-gray-900">
                        <span className="mr-2 text-gray-500">Q.</span>
                        <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: (question.title || 'Untitled Question').replace(/\\n/g, '<br/>') }} />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 md:ml-6">
                        {question.option1 && <div className={question.correctOption === '1' || question.correctOption === 1 ? "text-green-700 font-semibold bg-green-50 p-2 rounded border border-green-200" : "p-2 border border-transparent"}>1. <span dangerouslySetInnerHTML={{__html: question.option1}}/></div>}
                        {question.option2 && <div className={question.correctOption === '2' || question.correctOption === 2 ? "text-green-700 font-semibold bg-green-50 p-2 rounded border border-green-200" : "p-2 border border-transparent"}>2. <span dangerouslySetInnerHTML={{__html: question.option2}}/></div>}
                        {question.option3 && <div className={question.correctOption === '3' || question.correctOption === 3 ? "text-green-700 font-semibold bg-green-50 p-2 rounded border border-green-200" : "p-2 border border-transparent"}>3. <span dangerouslySetInnerHTML={{__html: question.option3}}/></div>}
                        {question.option4 && <div className={question.correctOption === '4' || question.correctOption === 4 ? "text-green-700 font-semibold bg-green-50 p-2 rounded border border-green-200" : "p-2 border border-transparent"}>4. <span dangerouslySetInnerHTML={{__html: question.option4}}/></div>}
                      </div>

                      <div className="text-xs text-gray-500 md:ml-6 flex flex-wrap gap-3 items-center mt-2">
                        <Badge variant="outline" className="bg-white">{question.type || 'MCQ'}</Badge>
                        <span className="font-medium">Marks: <span className="text-green-600">+{question.positiveMarks ?? 1}</span> / <span className="text-red-600">-{question.negativeMarks ?? 0}</span></span>
                        {question.solutionText && <span className="flex items-center text-blue-600"><CheckCircle className="size-3 mr-1"/> Solution Attached</span>}
                        {question.section && <Badge variant="secondary" className="text-[10px]">{question.section}</Badge>}
                      </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col gap-2 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" onClick={() => openEditEditor(question)} className="h-8 justify-start gap-1.5 w-full md:w-auto">
                        <Pencil className="size-3.5" /> <span className="hidden md:inline">Edit</span>
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 justify-start text-red-500 hover:text-red-600 hover:bg-red-50 w-full md:w-auto" onClick={() => { setQuestionToDelete(question); setDeleteDialogOpen(true) }}>
                        <Trash2 className="size-3.5" /> <span className="hidden md:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}`;
content = content.replace(oldListRenderRegex, newListRender);

// 6. Inject modals at the end
const endRegex = /    <\/div>\s*\)\s*\}/;
const newEnd = `      {/* Floating Action Bar */}
      {selectedQuestions.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-5">
          <span className="font-medium">{selectedQuestions.length} questions selected</span>
          <div className="flex items-center gap-3 border-l border-gray-700 pl-6">
            <Button variant="secondary" size="sm" onClick={() => setCreateTestModalOpen(true)}>
              Create Test from Selected
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800" onClick={() => setSelectedQuestions([])}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Create Test Modal */}
      <Dialog open={createTestModalOpen} onOpenChange={setCreateTestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Test</DialogTitle>
            <DialogDescription>
              This will duplicate the {selectedQuestions.length} selected questions and add them to a new test.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Title</label>
              <Input 
                placeholder="e.g. Weekly Mock Test" 
                value={newTestTitle}
                onChange={e => setNewTestTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Test Series</label>
              <Select value={newTestSeriesId} onValueChange={setNewTestSeriesId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a Test Series..." />
                </SelectTrigger>
                <SelectContent>
                  {testSeriesOptions.map(series => (
                    <SelectItem key={series.id} value={series.id}>{series.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTestModalOpen(false)} disabled={isCreatingTest}>Cancel</Button>
            <Button 
              onClick={handleCreateTest} 
              disabled={isCreatingTest || !newTestTitle.trim() || !newTestSeriesId}
            >
              {isCreatingTest ? 'Creating...' : 'Create Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}`;
content = content.replace(endRegex, newEnd);

fs.writeFileSync(file, content);
console.log('Successfully injected UI logic');
