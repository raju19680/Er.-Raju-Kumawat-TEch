'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

interface TestResultProps {
  result: {
    score: number
    totalMarks: number
    totalQuestions: number
    correctAnswers: number
    wrongAnswers: number
  }
  testId: string
}

export function TestResult({ result, testId }: TestResultProps) {
  const router = useRouter()
  
  const percentage = result.totalMarks > 0 
    ? Math.round((result.score / result.totalMarks) * 100) 
    : 0

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow text-center">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Test Submitted Successfully!</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600 font-semibold mb-1">Score</p>
          <p className="text-2xl font-bold text-blue-800">{result.score} / {result.totalMarks}</p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600 font-semibold mb-1">Percentage</p>
          <p className="text-2xl font-bold text-green-800">{percentage}%</p>
        </div>
        
        <div className="p-4 bg-emerald-50 rounded-lg">
          <p className="text-sm text-emerald-600 font-semibold mb-1">Correct</p>
          <p className="text-2xl font-bold text-emerald-800">{result.correctAnswers}</p>
        </div>
        
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-600 font-semibold mb-1">Wrong</p>
          <p className="text-2xl font-bold text-red-800">{result.wrongAnswers}</p>
        </div>
      </div>
      
      <div className="flex justify-center gap-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
