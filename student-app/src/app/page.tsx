'use client'

import { Component, ReactNode, lazy, Suspense, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'

// ── Chunk Load Error Boundary ───────────────────────────────────────────────
class ChunkErrorBoundary extends Component<
  { children: ReactNode; name: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; name: string }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    if (error.name === 'ChunkLoadError' || error.message?.includes('chunk')) {
      return { hasError: true, error }
    }
    throw error
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <h2 className="text-xl font-bold">Loading Portal...</h2>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const StudentLayoutComponent = lazy(() => import('@/components/student-portal/student-layout'))

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
    </div>
  )
}

function ViewRouter() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StudentLayoutComponent />
    </Suspense>
  )
}

export default function Home() {
  return (
    <ChunkErrorBoundary name="Application">
      <ViewRouter />
    </ChunkErrorBoundary>
  )
}
