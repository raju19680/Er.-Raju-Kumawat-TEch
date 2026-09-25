'use client'

import { Component, ReactNode, lazy, Suspense } from 'react'
import { useAppStore } from '@/lib/store'
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'
import { useUrlSync } from '@/hooks/use-url-sync'

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
    const isChunkError =
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Failed to load chunk') ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Loading CSS chunk')

    if (isChunkError) {
      return { hasError: true, error }
    }
    throw error
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Module Update</h2>
            <p className="text-sm text-gray-500">
              A newer version of this module is available. Click below to load it.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Module
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Lazy-loaded layouts (reduces initial compilation memory) ───────────────
// Only the Login component is loaded initially; other layouts load on demand.
const CMSLayoutComponent = lazy(() => import('@/components/cms/cms-layout'))
const AdminLayoutComponent = lazy(() => import('@/components/admin/admin-layout'))

const LoginComponent = lazy(() => import('@/components/login/login-page'))

// ── Loading fallback ────────────────────────────────────────────────────────
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  )
}

// ── View Router ─────────────────────────────────────────────────────────────
function ViewRouter() {
  const currentView = useAppStore((s) => s.currentView)

  return (
    <Suspense fallback={<LoadingFallback />}>
      {(() => {
        switch (currentView) {
          case 'cms':
            return <CMSLayoutComponent />
          case 'admin':
            return <AdminLayoutComponent />
          
          case 'login':
          default:
            return <LoginComponent />
        }
      })()}
    </Suspense>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  useUrlSync()

  return (
    <main className="min-h-screen bg-gray-50/50">
      <ChunkErrorBoundary name="Root View Router">
        <ViewRouter />
      </ChunkErrorBoundary>
    </main>
  )
}

