"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2, ArrowLeft } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { QuestionForm } from "./question-form"

interface TestQuestionsManagerProps {
  testId: string
  testTitle: string
  onBack: () => void
  hideHeader?: boolean
}

export function TestQuestionsManager({ testId, testTitle, onBack, hideHeader = false }: TestQuestionsManagerProps) {
  const [questions, setQuestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null)
  
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchQuestions = async () => {
    setIsLoading(true)
    try {
      const res = await apiFetch(`/api/teacher/tests/${testId}/questions`)
      const data = await res.json()
      if (data.success) {
        setQuestions(data.questions)
      } else {
        toast.error(data.error || "Failed to fetch questions")
      }
    } catch (error) {
      toast.error("An error occurred while fetching questions")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [testId])

  const handleDelete = async () => {
    if (!deleteConfirm) return

    setIsDeleting(true)
    try {
      const res = await apiFetch(`/api/teacher/tests/${testId}/questions/${deleteConfirm}`, {
        method: "DELETE",
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success("Question deleted successfully")
        setQuestions(questions.filter(q => q.id !== deleteConfirm))
      } else {
        toast.error(data.error || "Failed to delete question")
      }
    } catch (error) {
      toast.error("An error occurred while deleting question")
    } finally {
      setIsDeleting(false)
      setDeleteConfirm(null)
    }
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingQuestion(null)
    fetchQuestions()
  }

  if (isFormOpen) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</CardTitle>
          </div>
          <CardDescription>
            {editingQuestion ? "Update the question details below." : "Fill in the details to add a new question to this test."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuestionForm
            testId={testId}
            initialData={editingQuestion}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsFormOpen(false)
              setEditingQuestion(null)
            }}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {!hideHeader && (
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>Questions: {testTitle}</CardTitle>
            </div>
            <CardDescription>
              Manage the questions for this test.
            </CardDescription>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </CardHeader>
      )}
      <CardContent className={hideHeader ? "pt-6" : ""}>
        {hideHeader && (
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
            No questions added yet. Click "Add Question" to start.
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="border p-4 rounded-lg flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <div className="font-medium flex items-start">
                    <span className="mr-2">Q{index + 1}.</span>
                    <span className="whitespace-pre-wrap">{question.title}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground ml-6">
                    <div className={question.correctOption === 1 ? "text-green-600 font-medium" : ""}>1. {question.option1}</div>
                    <div className={question.correctOption === 2 ? "text-green-600 font-medium" : ""}>2. {question.option2}</div>
                    <div className={question.correctOption === 3 ? "text-green-600 font-medium" : ""}>3. {question.option3}</div>
                    <div className={question.correctOption === 4 ? "text-green-600 font-medium" : ""}>4. {question.option4}</div>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6 flex gap-4">
                    <span>Marks: +{question.positiveMarks} / -{question.negativeMarks}</span>
                    {question.solutionText && <span>Has solution</span>}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingQuestion(question)
                      setIsFormOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => setDeleteConfirm(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the question.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete()
                }}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
