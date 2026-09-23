'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, FileText, DownloadCloud } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'

interface SecurePdfViewerProps {
  url: string
  title: string
  teacherName?: string
  watermarkText?: string
  allowDownload?: boolean
  downloadUrl?: string
  isPasswordProtected?: boolean
  testId?: string
}

export function SecurePdfViewer({ 
  url, 
  title, 
  teacherName = 'Institute', 
  watermarkText,
  allowDownload = false,
  downloadUrl,
  isPasswordProtected = false,
  testId
}: SecurePdfViewerProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [phone, setPhone] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const userName = useAppStore(s => s.userName)
  const userRole = useAppStore(s => s.userRole)

  useEffect(() => {
    if (userRole !== 'student') {
      setUnlocked(true)
      return
    }
    
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
  }, [userRole])

  // Anti-tamper: disable print and save shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's' || e.key === 'u')) {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) {
      setError('Could not verify your identity. Please ensure you are logged in.')
      return
    }
    
    const cleanEntered = password.trim().replace(/[^0-9]/g, '')
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '')
    
    if (cleanEntered === cleanPhone || password.trim() === phone.trim()) {
      setUnlocked(true)
      setError('')
    } else {
      setError('Incorrect password. Please enter your 10-digit registered mobile number.')
    }
  }

  const handleDownload = async () => {
    if (!allowDownload) return
    setIsDownloading(true)
      try {
        const targetUrl = downloadUrl || (testId ? `/api/student/tests/${testId}/download-pdf` : `/api/student/pdf/download?url=${encodeURIComponent(url)}`)
        
        if (isPasswordProtected) {
          alert(`Document will be downloaded with password protection.\n\nOpen Password: Your registered mobile number (${phone || 'your phone number'})`)
        }

        const res = await fetch(targetUrl)
      if (!res.ok) {
        throw new Error('Failed to download PDF')
      }
      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
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

  if (!unlocked) {
    return (
      <Card className="w-full max-w-md mx-auto my-8 border-amber-200 bg-amber-50/40 shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Lock className="size-8 text-amber-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">Protected PDF Document</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            This document is secure and watermarked. Enter your registered mobile number to view.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUnlock} className="space-y-4 mt-2">
            <div>
              <Input
                type="password"
                placeholder="Enter 10-digit mobile number..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center font-mono text-base"
              />
              {error && <p className="text-xs text-red-600 font-medium mt-2 text-center">{error}</p>}
            </div>
            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium">
              Unlock & View Document
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  const watermarkString = `${teacherName} • ${userName || 'Student'} • ${phone || email || 'Protected Copy'}`

  return (
    <div 
      className="relative flex flex-col items-center bg-gray-100 border rounded-xl overflow-hidden w-full select-none shadow-sm"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Dynamic Multi-Layer Repeating Watermark Overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden opacity-[0.14] select-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-16 -rotate-45 my-14 whitespace-nowrap">
            {Array.from({ length: 4 }).map((_, j) => (
              <span key={j} className="text-2xl font-black text-gray-800 tracking-wider">
                {watermarkString}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Header Bar with Security Details and Download Option */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3 bg-white border-b z-20">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="size-5 text-red-500 shrink-0" />
          <span className="font-semibold text-sm text-gray-900 truncate">{title}</span>
          {isPasswordProtected && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
              <Lock className="size-3" /> PIN Protected
            </span>
          )}
        </div>

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
            Download Disabled by Teacher
          </Button>
        )}
      </div>

      {/* Embedded PDF Viewer */}
      <div className="w-full relative z-0 bg-gray-50" style={{ minHeight: '650px' }}>
        <iframe
          src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
          className="w-full h-[650px] border-0"
          title={title}
        />
      </div>
    </div>
  )
}
