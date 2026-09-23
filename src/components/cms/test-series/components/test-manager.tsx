"use client"

import React, { useState } from "react"
import { ArrowLeft, HelpCircle, Upload, BarChart3, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

import { TestQuestionsManager } from "./test-questions-manager"
import BulkUploader from "@/components/cms/test-portal/bulk-uploader"
import ResultsPage from "@/components/cms/test-portal/results-page"
import ReportedQuestions from "@/components/cms/test-portal/reported-questions"

interface TestManagerProps {
  testId: string
  testTitle: string
  onBack: () => void
}

type TabType = "questions" | "upload" | "results" | "reports"

export function TestManager({ testId, testTitle, onBack }: TestManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("questions")

  const tabs = [
    { id: "questions", label: "Questions", icon: HelpCircle },
    { id: "upload", label: "Bulk Upload", icon: Upload },
    { id: "results", label: "Results", icon: BarChart3 },
    { id: "reports", label: "Reported Questions", icon: AlertCircle },
  ] as const

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{testTitle}</h1>
            <p className="text-xs text-gray-500">Manage all aspects of this test</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-4 overflow-x-auto whitespace-nowrap shrink-0">
        <div className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-amber-600 text-amber-700"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="mx-auto w-full h-full p-4 lg:p-8 max-w-5xl">
          {activeTab === "questions" && (
            <TestQuestionsManager testId={testId} testTitle={testTitle} onBack={onBack} hideHeader={true} />
          )}
          {activeTab === "upload" && (
            <div className="bg-white rounded-xl shadow-sm p-4 border">
              <BulkUploader preselectedTestId={testId} />
            </div>
          )}
          {activeTab === "results" && (
            <div className="bg-white rounded-xl shadow-sm p-4 border">
              <ResultsPage testIdFilter={testId} />
            </div>
          )}
          {activeTab === "reports" && (
            <div className="bg-white rounded-xl shadow-sm p-4 border">
              <ReportedQuestions testIdFilter={testId} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
