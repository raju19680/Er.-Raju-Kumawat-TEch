'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, FileText, DownloadCloud, ChevronLeft, ChevronRight, Loader2, BookOpen, File as FileIcon, LayoutList, ZoomIn, ZoomOut } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Initialize pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface SecurePdfViewerProps {
  url: string
  title: string
  teacherName?: string
  watermarkText?: string
  allowDownload?: boolean
  downloadUrl?: string
  isPasswordProtected?: boolean
  testId?: string
  initialPage?: number
  onPageChange?: (page: number) => void
}

export function SecurePdfViewer({ 
  url, 
  title, 
  teacherName = 'Institute', 
  watermarkText,
  allowDownload = false,
  downloadUrl,
  isPasswordProtected = false,
  testId,
  initialPage,
  onPageChange
}: SecurePdfViewerProps) {
  const [phone, setPhone] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [width, setWidth] = useState(800)
  const userName = useAppStore(s => s.userName)
  const userRole = useAppStore(s => s.userRole)

  // PDF State
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(initialPage && initialPage > 0 ? initialPage : 1)
  const [scale, setScale] = useState(1.0)
  const [viewMode, setViewMode] = useState<'single' | 'continuous' | 'book'>('single')

  useEffect(() => {
    setWidth(Math.min(window.innerWidth - 60, 800))
    const handleResize = () => setWidth(Math.min(window.innerWidth - 60, 800))
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function changePage(offset: number) {
    setPageNumber(prev => {
      const newPage = prev + offset
      if (onPageChange) onPageChange(newPage)
      return newPage
    })
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    if (initialPage && initialPage <= numPages && initialPage > 0) {
      setPageNumber(initialPage)
    } else {
      setPageNumber(1)
    }
  }

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await apiFetchJSON<{ success: boolean; student?: { phone: string; email: string } }>('/api/student/profile')
        if (res.success && res.student) {
          if (res.student.phone) setPhone(res.student.phone)
          if (res.student.email) setEmail(res.student.email)
        }
      } catch (e) {
        console.error('Failed to fetch student profile:', e)
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's' || e.key === 'u')) {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleDownload = async () => {
    if (!allowDownload) return
    setIsDownloading(true)
    try {
      // Points to our new secure auto-encrypt endpoint
      const targetUrl = downloadUrl || (testId ? `/api/student/tests/${testId}/download-pdf` : `/api/student/pdf/download?url=${encodeURIComponent(url)}`)
      
      if (isPasswordProtected) {
        alert(`Document will be downloaded with password protection.\n\nOpen Password: Your registered mobile number (${phone || 'your phone number'})`)
      }

      const res = await fetch(targetUrl, { credentials: 'include' })
      if (!res.ok) {
        throw new Error('Failed to download PDF')
      }
      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_secure.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Download error:', err)
      alert('Could not download the document. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }



  const watermarkString = [email, phone].filter(Boolean).join(' • ') || 'Protected Copy'

  return (
    <div 
      className="relative flex flex-col items-center bg-gray-100 border rounded-xl overflow-hidden w-full select-none shadow-sm"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="pointer-events-none sticky top-1/2 left-0 right-0 z-20 flex items-center justify-center overflow-visible opacity-[0.08] select-none h-0" style={{ transform: 'translateY(-50%)' }}>
        <div className="-rotate-45 whitespace-nowrap w-full text-center">
          <span className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-800 tracking-widest drop-shadow-sm">
            {watermarkString}
          </span>
        </div>
      </div>

      <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3 bg-white border-b z-30 shadow-sm relative">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="size-5 text-red-500 shrink-0" />
          <span className="font-semibold text-sm text-gray-900 truncate">{title}</span>
          {isPasswordProtected && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
              <Lock className="size-3" /> PIN Protected
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('single')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'single' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-900'}`}
              title="Single Page"
            >
              <FileIcon className="size-4" />
            </button>
            <button
              onClick={() => setViewMode('continuous')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'continuous' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-900'}`}
              title="Continuous Scroll"
            >
              <LayoutList className="size-4" />
            </button>
            <button
              onClick={() => setViewMode('book')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'book' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-900'}`}
              title="Book Mode"
            >
              <BookOpen className="size-4" />
            </button>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-1.5 rounded-md transition-colors text-gray-500 hover:text-gray-900 hover:bg-white" title="Zoom Out"><ZoomOut className="size-4" /></button>
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-700 w-12 text-center my-auto">{Math.round(scale * 100)}%</div>
            <button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="p-1.5 rounded-md transition-colors text-gray-500 hover:text-gray-900 hover:bg-white" title="Zoom In"><ZoomIn className="size-4" /></button>
          </div>

          {numPages && viewMode === 'single' && (
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
              <button 
                onClick={() => changePage(-1)}
                disabled={pageNumber <= 1}
                className="disabled:opacity-50 hover:text-black transition"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span>{pageNumber} / {numPages}</span>
              <button 
                onClick={() => changePage(1)}
                disabled={pageNumber >= numPages}
                className="disabled:opacity-50 hover:text-black transition"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
          
          {numPages && viewMode === 'book' && (
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
              <button 
                onClick={() => changePage(-2)}
                disabled={pageNumber <= 1}
                className="disabled:opacity-50 hover:text-black transition"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span>{pageNumber === 1 ? '1' : `${pageNumber}-${Math.min(pageNumber + 1, numPages)}`} / {numPages}</span>
              <button 
                onClick={() => changePage(pageNumber === 1 ? 1 : 2)}
                disabled={pageNumber >= numPages || (pageNumber === numPages - 1 && numPages % 2 === 0)}
                className="disabled:opacity-50 hover:text-black transition"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}

          {allowDownload ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 text-primary border-primary hover:bg-primary/5 font-medium"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <DownloadCloud className="size-4" />
              {isDownloading ? 'Preparing...' : 'Download PDF'}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="gap-2 text-gray-400 cursor-not-allowed" disabled>
              <DownloadCloud className="size-4" />
              Download Disabled
            </Button>
          )}
        </div>
      </div>

      <div className="w-full relative z-10 bg-gray-200/50 flex flex-col items-center py-4 min-h-[650px] overflow-auto">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="size-8 animate-spin mb-4" />
              <p>Loading Secure Document...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center py-20 text-red-500">
              <p>Failed to load PDF. Please check your connection.</p>
            </div>
          }
          className={`shadow-lg ${viewMode === 'book' ? 'flex flex-row justify-center bg-transparent shadow-none' : ''}`}
        >
          {viewMode === 'single' && (
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={false} scale={scale}
              renderAnnotationLayer={false}
              width={width}
              className="bg-white rounded mb-4"
            />
          )}
          
          {viewMode === 'continuous' && numPages && Array.from(new Array(numPages), (el, index) => (
            <Page 
              key={`page_${index + 1}`}
              pageNumber={index + 1} 
              renderTextLayer={false} scale={scale}
              renderAnnotationLayer={false}
              width={width}
              className="bg-white rounded mb-6 shadow-sm"
            />
          ))}

          {viewMode === 'book' && numPages && (
            <div className="flex flex-row justify-center gap-1">
              {pageNumber === 1 ? (
                <div className="flex justify-center w-full">
                  <Page 
                    pageNumber={1} 
                    renderTextLayer={false} scale={scale}
                    renderAnnotationLayer={false}
                    width={width}
                    className="bg-white rounded shadow-sm"
                  />
                </div>
              ) : (
                <>
                  <Page 
                    pageNumber={pageNumber} 
                    renderTextLayer={false} scale={scale}
                    renderAnnotationLayer={false}
                    width={width / 2 - 10}
                    className="bg-white rounded shadow-sm border-r border-gray-200"
                  />
                  {pageNumber + 1 <= numPages && (
                    <Page 
                      pageNumber={pageNumber + 1} 
                      renderTextLayer={false} scale={scale}
                      renderAnnotationLayer={false}
                      width={width / 2 - 10}
                      className="bg-white rounded shadow-sm border-l border-gray-200"
                    />
                  )}
                </>
              )}
            </div>
          )}
        </Document>
      </div>
    </div>
  )
}










