'use client'

import React, { useState } from 'react'
import { GraduationCap, BookOpen, StickyNote, TestTube2, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import CourseManagementPage from '@/components/teacher/course-management-page'
import DigitalProductTypePage from '@/components/teacher/digital-product-type-page'

// ── Tab Config ──────────────────────────────────────────────────────────
const tabs = [
  { id: 'courses', label: 'Courses', icon: GraduationCap, color: 'violet' },
  { id: 'ebooks', label: 'E-Books', icon: BookOpen, color: 'sky' },
  { id: 'notes', label: 'Notes', icon: StickyNote, color: 'emerald' },
  { id: 'test-series', label: 'Test Series', icon: TestTube2, color: 'amber' },
  { id: 'other', label: 'Other', icon: Layers, color: 'gray' },
] as const

type DigitalProductTab = typeof tabs[number]['id']

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DIGITAL PRODUCTS PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function DigitalProductsPage() {
  const [activeTab, setActiveTab] = useState<DigitalProductTab>('courses')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'courses':
        return <CourseManagementPage key="courses" />
      case 'ebooks':
        return <DigitalProductTypePage key="ebook" productType="ebook" />
      case 'notes':
        return <DigitalProductTypePage key="notes" productType="notes" />
      case 'test-series':
        return <DigitalProductTypePage key="test_series" productType="test_series" />
      case 'other':
        return <DigitalProductTypePage key="other" productType="other" />
      default:
        return <CourseManagementPage key="default" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Digital Products</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your courses, e-books, notes, and other digital products</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px overflow-x-auto" aria-label="Digital product tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'border-amber-500 text-amber-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive && 'text-amber-600')} />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  )
}
