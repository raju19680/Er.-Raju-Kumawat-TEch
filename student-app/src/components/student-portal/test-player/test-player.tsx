'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { TestResult } from './test-result'

interface Question {
  id: string
  title: string
  option1?: string
  option2?: string
  option3?: string
  option4?: string
  option5?: string
  positiveMarks: number
  negativeMarks: number
}

interface TestData {
  id: string
  title: string
  totalDuration: number
}

export function TestPlayer({ testId }: { testId: string }) {
  const [status, setStatus] = useState<'loading' | 'playing' | 'submitting' | 'completed' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [test, setTest] = useState<TestData | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set())
  const [visited, setVisited] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState<number>(0)
  
  const [result, setResult] = useState<any>(null)

  const fetchTest = async () => {
    try {
      const res = await fetch(`/api/student/tests/${testId}/start`, { method: 'POST' })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start test')
      }
      
      setTest(data.test)
      setQuestions(data.questions)
      setTimeLeft((data.test.totalDuration || 60) * 60)
      
      if (data.questions.length > 0) {
        setVisited(new Set([data.questions[0].id]))
      }
      
      if (data.attempt?.answers) {
        try {
          const parsedAnswers = JSON.parse(data.attempt.answers)
          setAnswers(parsedAnswers)
        } catch (e) {}
      }
      
      setStatus('playing')
    } catch (error: any) {
      setErrorMsg(error.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    fetchTest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId])

  const submitTest = useCallback(async () => {
    if (status !== 'playing') return
    setStatus('submitting')
    
    try {
      const timeTaken = ((test?.totalDuration || 60) * 60) - timeLeft
      
      const res = await fetch(`/api/student/tests/${testId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, timeTaken })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit test')
      }
      
      setResult(data.result)
      setStatus('completed')
    } catch (error: any) {
      setErrorMsg(error.message)
      setStatus('error')
    }
  }, [answers, status, test, testId, timeLeft])

  useEffect(() => {
    if (status !== 'playing') return
    
    if (timeLeft <= 0) {
      submitTest()
      return
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [timeLeft, status, submitTest])

  if (status === 'loading') return <div className="p-8 text-center">Loading test...</div>
  if (status === 'submitting') return <div className="p-8 text-center">Submitting test...</div>
  if (status === 'error') return <div className="p-8 text-center text-red-600">{errorMsg}</div>
  if (status === 'completed' && result) return <TestResult result={result} testId={testId} />

  const currentQ = questions[currentIndex]
  
  const handleOptionSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: option }))
  }
  
  const handleClear = () => {
    setAnswers(prev => {
      const next = { ...prev }
      delete next[currentQ.id]
      return next
    })
  }
  
  const handleMarkForReview = () => {
    setMarkedForReview(prev => {
      const next = new Set(prev)
      if (next.has(currentQ.id)) {
        next.delete(currentQ.id)
      } else {
        next.add(currentQ.id)
      }
      return next
    })
  }

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index)
      setVisited(prev => {
        const next = new Set(prev)
        next.add(questions[index].id)
        return next
      })
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const getQuestionStatusColor = (q: Question) => {
    const isAnswered = !!answers[q.id]
    const isMarked = markedForReview.has(q.id)
    const isVisited = visited.has(q.id)
    
    if (isMarked) return 'bg-purple-500 text-white border-purple-600'
    if (isAnswered) return 'bg-green-500 text-white border-green-600'
    if (isVisited) return 'bg-red-500 text-white border-red-600'
    return 'bg-gray-200 text-gray-700 border-gray-300'
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">{test?.title}</h1>
        <div className="flex items-center gap-4">
          <div className="font-mono text-lg font-semibold bg-gray-100 px-4 py-1 rounded-md">
            {formatTime(timeLeft)}
          </div>
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to submit the test?')) {
                submitTest()
              }
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            Submit Test
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-lg font-semibold">Question {currentIndex + 1}</h2>
              <div className="text-sm text-gray-500">
                <span className="text-green-600 mr-3">+{currentQ.positiveMarks}</span>
                <span className="text-red-600">-{currentQ.negativeMarks}</span>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="text-lg mb-8 text-gray-800" dangerouslySetInnerHTML={{ __html: currentQ.title }} />
              
              <div className="space-y-3">
                {[currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4, currentQ.option5]
                  .filter(Boolean)
                  .map((opt, i) => {
                    const optKey = `option${i + 1}`
                    const isSelected = answers[currentQ.id] === optKey
                    return (
                      <label 
                        key={optKey} 
                        className={`flex items-start p-4 rounded-md border cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQ.id}`}
                          value={optKey}
                          checked={isSelected}
                          onChange={() => handleOptionSelect(optKey)}
                          className="mt-1 mr-4 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: opt as string }} />
                      </label>
                    )
                  })}
              </div>
            </div>
            
            {/* Footer Buttons */}
            <div className="mt-8 flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <button
                  onClick={handleClear}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Clear
                </button>
                <button
                  onClick={handleMarkForReview}
                  className="px-4 py-2 border border-yellow-400 bg-yellow-50 rounded-md text-yellow-700 hover:bg-yellow-100"
                >
                  {markedForReview.has(currentQ.id) ? 'Unmark Review' : 'Mark for Review'}
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => goToQuestion(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => goToQuestion(currentIndex + 1)}
                  disabled={currentIndex === questions.length - 1}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
        
        {/* Sidebar */}
        <aside className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col overflow-y-auto">
          <h3 className="font-semibold text-gray-800 mb-4">Questions</h3>
          
          <div className="grid grid-cols-5 gap-2 mb-8">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => goToQuestion(idx)}
                className={`h-11 w-11 flex items-center justify-center rounded border text-sm font-medium ${getQuestionStatusColor(q)} ${currentIndex === idx ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          
          <div className="mt-auto space-y-3 text-sm">
            <h4 className="font-semibold text-gray-700 mb-2">Legend</h4>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span>Not Visited</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
