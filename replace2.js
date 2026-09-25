const fs = require('fs');
const file = 'h:/Er. Raju Kumawat APP - Copy/src/components/cms/test-portal/question-library.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldListRender =         {/* Questions Display - List View */}
        {!loading && !error && questions.length > 0 && viewMode === 'list' && (
          <Card className="rounded-xl">
            <CardContent className="p-0">
              <div className="divide-y">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <Badge variant="secondary" className={\	ext-xs px-2 py-0.5 shrink-0 \\}>
                      {question.type}
                    </Badge>
                    <p className="flex-1 text-sm text-gray-700 truncate">
                      {question.text}
                    </p>
                    <Badge variant="outline" className="text-xs shrink-0 hidden sm:inline-flex">
                      {question.section}
                    </Badge>
                    <Badge variant="secondary" className={\	ext-xs shrink-0 hidden md:inline-flex \\}>
                      {question.difficulty}
                    </Badge>
                    <span className="text-xs font-medium text-muted-foreground shrink-0 w-14 text-right">
                      {question.positiveMarks}m
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => openEditEditor(question)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleDuplicate(question)}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                        onClick={() => {
                          setQuestionToDelete(question)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )};

const newListRender =         {/* Questions Display - List View */}
        {!loading && !error && questions.length > 0 && viewMode === 'list' && (
          <Card className="rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y">
                {questions.map((question) => (
                  <div key={question.id} className="p-6 flex flex-col md:flex-row justify-between items-start gap-4 hover:bg-gray-50/50 transition-colors relative">
                    <div className="absolute left-4 top-6">
                      <Checkbox 
                         checked={selectedQuestions.includes(question.id)} 
                         onCheckedChange={(checked) => {
                           if (checked) setSelectedQuestions(prev => [...prev, question.id])
                           else setSelectedQuestions(prev => prev.filter(id => id !== question.id))
                         }}
                      />
                    </div>
                    <div className="flex-1 space-y-3 pl-8">
                      <div className="font-medium flex items-start text-gray-900">
                        <span className="mr-2 text-gray-500">Q.</span>
                        <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: (question.title || 'Untitled Question').replace(/\\n/g, '<br/>') }} />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 ml-6">
                        {question.option1 && <div className={question.correctOption === '1' || question.correctOption === 1 ? "text-green-700 font-semibold bg-green-50 p-2 rounded border border-green-200" : "p-2 border border-transparent"}>1. <span dangerouslySetInnerHTML={{__html: question.option1}}/></div>}
                        {question.option2 && <div className={question.correctOption === '2' || question.correctOption === 2 ? "text-green-700 font-semibold bg-green-50 p-2 rounded border border-green-200" : "p-2 border border-transparent"}>2. <span dangerouslySetInnerHTML={{__html: question.option2}}/></div>}
                        {question.option3 && <div className={question.correctOption === '3' || question.correctOption === 3 ? "text-green-700 font-semibold bg-green-50 p-2 rounded border border-green-200" : "p-2 border border-transparent"}>3. <span dangerouslySetInnerHTML={{__html: question.option3}}/></div>}
                        {question.option4 && <div className={question.correctOption === '4' || question.correctOption === 4 ? "text-green-700 font-semibold bg-green-50 p-2 rounded border border-green-200" : "p-2 border border-transparent"}>4. <span dangerouslySetInnerHTML={{__html: question.option4}}/></div>}
                      </div>

                      <div className="text-xs text-gray-500 ml-6 flex flex-wrap gap-3 items-center">
                        <Badge variant="outline" className="bg-white">{question.type || 'MCQ'}</Badge>
                        <span className="font-medium">Marks: <span className="text-green-600">+{question.positiveMarks ?? 1}</span> / <span className="text-red-600">-{question.negativeMarks ?? 0}</span></span>
                        {question.solutionText && <span className="flex items-center text-blue-600"><CheckCircle className="size-3 mr-1"/> Solution Attached</span>}
                        {question.section && <Badge variant="secondary" className="text-[10px]">{question.section}</Badge>}
                      </div>
                    </div>
                    
                    <div className="flex flex-row md:flex-col gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEditEditor(question)} className="h-8 justify-start gap-1.5 w-full md:w-auto">
                        <Pencil className="size-3.5" /> <span className="hidden md:inline">Edit</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDuplicate(question)} className="h-8 justify-start gap-1.5 w-full md:w-auto">
                        <Copy className="size-3.5" /> <span className="hidden md:inline">Duplicate</span>
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
        )};

if (content.includes('Questions Display - List View')) {
    content = content.replace(oldListRender, newListRender);
    fs.writeFileSync(file, content);
    console.log('Successfully replaced list view render');
} else {
    console.log('List view render block not found');
}
