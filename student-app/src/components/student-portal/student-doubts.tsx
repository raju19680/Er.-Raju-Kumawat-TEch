'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle,
  MessageSquarePlus,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Search,
  MessageSquare,
  User,
  Plus,
} from 'lucide-react'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface DoubtQuery {
  id: string
  subject: string
  message: string
  status: string // open, in_progress, resolved, closed
  createdAt: string
  updatedAt: string
}

export default function StudentDoubts() {
  const { toast } = useToast()
  const [doubts, setDoubts] = useState<DoubtQuery[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const loadDoubts = async () => {
    setLoading(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; doubts: DoubtQuery[] }>(
        '/api/student/doubts'
      )
      if (res.success) {
        setDoubts(res.doubts)
      }
    } catch (err) {
      console.error('Doubts load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDoubts()
  }, [])

  const handleSubmitDoubt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide both a topic subject and your question details.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const res = await apiFetchJSON<{
        success: boolean
        message: string
        doubt: DoubtQuery
      }>('/api/student/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      })

      if (res.success) {
        toast({
          title: 'Doubt Submitted!',
          description: 'Your question has been sent to your instructor.',
        })
        setSubject('')
        setMessage('')
        setIsDialogOpen(false)
        loadDoubts()
      }
    } catch (err: any) {
      toast({
        title: 'Failed to submit',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
      case 'closed':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-semibold text-xs gap-1">
            <CheckCircle2 className="size-3" /> Resolved
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-semibold text-xs gap-1">
            <Clock className="size-3" /> In Review
          </Badge>
        )
      case 'open':
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-semibold text-xs gap-1">
            <Clock className="size-3" /> Pending Instructor
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ask Doubts & Q&A</h1>
          <p className="text-gray-500 text-sm mt-1">Get your academic questions resolved directly by teachers</p>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="size-3.5 text-teal-200" />
            <span>Dedicated Academic Support</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ask Questions & Clear Doubts
          </h1>
          <p className="mt-2 text-teal-100 text-sm sm:text-base leading-relaxed">
            Stuck on a tricky concept, formula, or test problem? Submit your query here and get expert guidance.
          </p>
          <div className="mt-5">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-white text-teal-900 hover:bg-teal-50 font-bold rounded-xl shadow-md gap-2 text-xs sm:text-sm"
            >
              <Plus className="size-4" /> Ask a New Question
            </Button>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <HelpCircle className="size-64 text-white" />
        </div>
      </div>

      {/* Ask Doubt Modal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <MessageSquarePlus className="size-5 text-teal-600" />
              Ask Your Doubt
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitDoubt} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                Subject / Topic Title
              </label>
              <Input
                placeholder="e.g., Mathematics: Integration by parts doubt in Q4"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="rounded-xl border-gray-200 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                Detailed Question or Explanation
              </label>
              <Textarea
                placeholder="Describe your question or paste the problem statement in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                className="rounded-xl border-gray-200 text-xs sm:text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold gap-1.5 shadow-sm"
              >
                <Send className="size-3.5" />
                {submitting ? 'Submitting...' : 'Submit Question'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Doubts List */}
      {doubts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <MessageSquare className="size-12 mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-bold text-gray-900">No Doubts Asked Yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Whenever you have questions while studying or taking mock tests, click "Ask a New Question" above.
          </p>
          <Button
            className="mt-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold gap-1.5"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="size-3.5" /> Ask Your First Doubt
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {doubts.map((doubt, idx) => (
              <motion.div
                key={doubt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="rounded-2xl border border-gray-100 bg-white hover:shadow-md transition-all duration-200 py-0">
                  <CardContent className="p-5 sm:p-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-gray-900">{doubt.subject}</span>
                        {getStatusBadge(doubt.status)}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(doubt.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      <p className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-1">
                        Your Question:
                      </p>
                      {doubt.message}
                    </div>

                    {doubt.status === 'open' && (
                      <p className="text-xs text-amber-600 flex items-center gap-1.5 pt-1">
                        <Clock className="size-3.5" />
                        Our instructor has received your query and will reply soon.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
