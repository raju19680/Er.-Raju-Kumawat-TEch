'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  MessageSquare,
  Headphones,
  Search,
  Reply,
  CheckCircle2,
  AlertTriangle,
  Send,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  MoreHorizontal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

interface SupportQuery {
  id: string
  subject: string
  message: string
  status: string
  studentName: string | null
  studentEmail: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-50 text-blue-700 hover:bg-blue-50',
  in_progress: 'bg-amber-50 text-amber-700 hover:bg-amber-50',
  resolved: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50',
  closed: 'bg-gray-100 text-gray-500 hover:bg-gray-100',
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

const PRIORITY_MAP: Record<string, { color: string; icon: React.ElementType }> = {
  high: { color: 'bg-orange-50 text-orange-700', icon: AlertTriangle },
  urgent: { color: 'bg-red-50 text-red-700', icon: XCircle },
  medium: { color: 'bg-amber-50 text-amber-700', icon: Clock },
  low: { color: 'bg-gray-50 text-gray-600', icon: Clock },
}

// Infer priority from subject keywords (simple heuristic since DB doesn't have priority field)
function inferPriority(query: SupportQuery): string {
  const text = `${query.subject} ${query.message}`.toLowerCase()
  if (text.includes('urgent') || text.includes('payment') || text.includes('refund')) return 'high'
  if (text.includes('cannot access') || text.includes('error') || text.includes('failed')) return 'medium'
  return 'low'
}

// ─── Component ────────────────────────────────────────────────────────────

export default function SupportPage() {
  const { currentPage, orgCode, setCurrentPage } = useAppStore()
  const defaultTab = currentPage === 'support-chat' ? 'chat' : 'queries'

  // Data
  const [queries, setQueries] = useState<SupportQuery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Chat tab
  const [selectedQuery, setSelectedQuery] = useState<SupportQuery | null>(null)
  const [chatInput, setChatInput] = useState('')

  // Reply drawer
  const [replyDrawerOpen, setReplyDrawerOpen] = useState(false)
  const [replyQuery, setReplyQuery] = useState<SupportQuery | null>(null)
  const [replyText, setReplyText] = useState('')

  // Close confirmation
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [queryToClose, setQueryToClose] = useState<SupportQuery | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  // ─── Fetch ─────────────────────────────────────────────────────────────

  const fetchQueries = useCallback(async () => {
    if (!orgCode) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        search: debouncedSearch,
        status: statusFilter === 'all' ? '' : statusFilter,
        organizationId: orgCode,
        limit: '50',
      })
      const res = await apiFetch(`/api/support-queries?${params}`)
      const data = await res.json()
      if (data.items) {
        setQueries(data.items)
      } else {
        setError(data.error || 'Failed to load support queries')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [orgCode, debouncedSearch, statusFilter])

  useEffect(() => {
    fetchQueries()
  }, [fetchQueries])

  // Auto-select first query for chat tab
  useEffect(() => {
    if (!selectedQuery && queries.length > 0) {
      setSelectedQuery(queries[0])
    }
  }, [queries, selectedQuery])

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleStatusUpdate = async (queryId: string, status: string, successMsg: string) => {
    try {
      const res = await apiFetch(`/api/support-queries/${queryId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, organizationId: orgCode }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(successMsg)
        setQueries((prev) =>
          prev.map((q) => (q.id === queryId ? { ...q, status } : q))
        )
        if (selectedQuery?.id === queryId) {
          setSelectedQuery((prev) => prev ? { ...prev, status } : prev)
        }
      } else {
        toast.error(data.error || 'Failed to update query')
      }
    } catch {
      toast.error('Network error. Please try again.')
    }
  }

  const openReplyDrawer = (query: SupportQuery) => {
    setReplyQuery(query)
    setReplyText('')
    setReplyDrawerOpen(true)
  }

  const handleSendReply = async () => {
    if (!replyQuery || !replyText.trim()) return
    setSubmitting(true)
    try {
      const res = await apiFetch(`/api/support-queries/${replyQuery.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'in_progress',
          message: replyText,
          organizationId: orgCode,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Reply sent')
        setQueries((prev) =>
          prev.map((q) =>
            q.id === replyQuery.id ? { ...q, status: 'in_progress' } : q
          )
        )
        setReplyDrawerOpen(false)
      } else {
        toast.error(data.error || 'Failed to send reply')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolve = (query: SupportQuery) => {
    handleStatusUpdate(query.id, 'resolved', 'Query marked as resolved')
  }

  const handleEscalate = (query: SupportQuery) => {
    // Since there's no priority field, we just move to in_progress if open
    if (query.status === 'open') {
      handleStatusUpdate(query.id, 'in_progress', 'Query escalated')
    } else {
      toast.info('Query is already being processed')
    }
  }

  const handleCloseQuery = async () => {
    if (!queryToClose) return
    await handleStatusUpdate(queryToClose.id, 'closed', 'Query closed')
    setCloseDialogOpen(false)
    setQueryToClose(null)
  }

  const handleSendChat = async () => {
    if (!chatInput.trim() || !selectedQuery) return
    const text = chatInput
    setChatInput('')
    try {
      await apiFetch(`/api/support-queries/${selectedQuery.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: selectedQuery.status === 'open' ? 'in_progress' : selectedQuery.status,
          message: text,
          organizationId: orgCode,
        }),
      })
      // Update local state optimistically
      setSelectedQuery((prev) =>
        prev && prev.id === selectedQuery.id
          ? { ...prev, status: prev.status === 'open' ? 'in_progress' : prev.status, updatedAt: new Date().toISOString() }
          : prev
      )
    } catch {
      toast.error('Failed to send message')
    }
  }

  // ─── Render helpers ────────────────────────────────────────────────────

  const renderError = (msg: string) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="size-5 text-red-500" />
      </div>
      <p className="text-sm font-medium text-gray-900">Something went wrong</p>
      <p className="text-xs text-muted-foreground mt-1">{msg}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={fetchQueries}>
        Try Again
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Support</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage support queries and conversations
        </p>
      </div>

      <Tabs value={defaultTab} onValueChange={(v) => {
        setCurrentPage(v === 'chat' ? 'support-chat' : 'support-queries')
      }} className="space-y-6">
        <div className="w-full overflow-x-auto">
          <TabsList className="w-max min-w-full">
            <TabsTrigger value="queries" className="gap-1.5 flex-shrink-0">
              <Headphones className="size-3.5" />
              Queries
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5 flex-shrink-0">
              <MessageSquare className="size-3.5" />
              Chat
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── Queries Tab ───────────────────────────────────────────── */}
        <TabsContent value="queries" className="space-y-4">
          {/* Filters */}
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search queries..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 rounded-lg"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] rounded-lg">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Queries Table */}
          <Card className="rounded-xl">
            <CardContent className="p-0">
              {loading && queries.length === 0 ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                renderError(error)
              ) : queries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Headphones className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No queries found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queries.map((query) => {
                        const priority = inferPriority(query)
                        const PriorityIcon = PRIORITY_MAP[priority]?.icon || Clock
                        return (
                          <TableRow key={query.id}>
                            <TableCell>
                              <p className="font-medium text-sm">{query.subject}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {query.message}
                              </p>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {query.studentName || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={STATUS_COLORS[query.status] || STATUS_COLORS.open}>
                                {STATUS_LABEL[query.status] || query.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={PRIORITY_MAP[priority]?.color || PRIORITY_MAP.low.color}>
                                <PriorityIcon className="size-3 mr-1" />
                                {priority.charAt(0).toUpperCase() + priority.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                              {new Date(query.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-9 w-8 p-0">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openReplyDrawer(query)}>
                                    <Reply className="size-4 mr-2" />
                                    Reply
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleResolve(query)}>
                                    <CheckCircle2 className="size-4 mr-2" />
                                    Mark Resolved
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEscalate(query)}>
                                    <AlertTriangle className="size-4 mr-2" />
                                    Escalate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => {
                                      setQueryToClose(query)
                                      setCloseDialogOpen(true)
                                    }}
                                  >
                                    Close Ticket
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Chat Tab ──────────────────────────────────────────────── */}
        <TabsContent value="chat" className="space-y-0">
          <Card className="rounded-xl overflow-hidden">
            <div className="flex flex-col sm:flex-row h-[500px] sm:h-[550px]">
              {/* Conversation List */}
              <div className="w-full sm:w-80 border-b sm:border-b-0 sm:border-r flex flex-col shrink-0 max-h-[200px] sm:max-h-none">
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      className="pl-9 rounded-lg h-8 text-sm"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="p-3 space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="size-9 rounded-full" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-3 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : queries.filter((q) => q.status === 'open' || q.status === 'in_progress').length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-xs text-muted-foreground">No active conversations</p>
                    </div>
                  ) : (
                    queries
                      .filter((q) => q.status === 'open' || q.status === 'in_progress')
                      .map((query) => (
                        <button
                          key={query.id}
                          className={`w-full p-3 flex items-start gap-3 text-left border-b hover:bg-gray-50 transition-colors ${
                            selectedQuery?.id === query.id ? 'bg-gray-50' : ''
                          }`}
                          onClick={() => setSelectedQuery(query)}
                        >
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-medium">
                              {(query.studentName || '?').split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm truncate">{query.studentName || 'Unknown'}</span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {new Date(query.updatedAt || query.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {query.subject}
                            </p>
                          </div>
                          {(query.status === 'open') && (
                            <span className="size-5 rounded-full bg-amber-500 text-white text-xs font-medium flex items-center justify-center shrink-0">
                              !
                            </span>
                          )}
                        </button>
                      ))
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col min-w-0">
                {selectedQuery ? (
                  <>
                    {/* Chat Header */}
                    <div className="px-4 py-3 border-b flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-medium">
                          {(selectedQuery.studentName || '?').split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{selectedQuery.studentName || 'Unknown'}</p>
                        <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${STATUS_COLORS[selectedQuery.status] || ''}`}>
                          {STATUS_LABEL[selectedQuery.status] || selectedQuery.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {/* Original message */}
                      <div className="flex justify-start">
                        <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-gray-100 text-gray-900 rounded-bl-md">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            {selectedQuery.studentName || 'Student'} — {new Date(selectedQuery.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-sm">{selectedQuery.message}</p>
                        </div>
                      </div>

                      {selectedQuery.status !== 'open' && selectedQuery.status !== 'in_progress' && (
                        <div className="flex justify-center">
                          <Badge variant="secondary" className="text-xs">
                            {STATUS_LABEL[selectedQuery.status] || selectedQuery.status}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    {selectedQuery.status !== 'closed' && selectedQuery.status !== 'resolved' ? (
                      <div className="p-3 border-t">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type a reply..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) handleSendChat()
                            }}
                            className="rounded-lg"
                          />
                          <Button
                            onClick={handleSendChat}
                            className="bg-black hover:bg-gray-800 text-white shrink-0"
                            size="icon"
                          >
                            <Send className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 border-t text-center">
                        <p className="text-xs text-muted-foreground">This conversation is {STATUS_LABEL[selectedQuery.status]?.toLowerCase()}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs"
                          onClick={() => handleStatusUpdate(selectedQuery.id, 'open', 'Conversation reopened')}
                        >
                          Reopen
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-4">
                    <div>
                      <MessageSquare className="size-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Reply Drawer ────────────────────────────────────────────── */}
      <Sheet open={replyDrawerOpen} onOpenChange={setReplyDrawerOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Reply to Ticket</SheetTitle>
            <SheetDescription>
              Responding to — {replyQuery?.subject}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            <div className="rounded-lg bg-gray-50 p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Original Message</p>
              <p className="text-sm text-gray-700">{replyQuery?.message}</p>
              <p className="text-xs text-muted-foreground">
                — {replyQuery?.studentName || 'Unknown'},{' '}
                {replyQuery?.createdAt &&
                  new Date(replyQuery.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reply-text">Your Reply</Label>
              <Textarea
                id="reply-text"
                placeholder="Type your response..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[150px] resize-y"
              />
            </div>
          </div>

          <SheetFooter className="border-t pt-4">
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setReplyDrawerOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-black hover:bg-gray-800 text-white"
                onClick={handleSendReply}
                disabled={submitting || !replyText.trim()}
              >
                {submitting ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  <><Send className="size-4 mr-2" />Send Reply</>
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── Close Confirmation Dialog ───────────────────────────────── */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Ticket</DialogTitle>
            <DialogDescription>
              Are you sure you want to close{' '}
              <span className="font-semibold text-foreground">{queryToClose?.subject}</span>? This
              will mark the ticket as closed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCloseQuery}>
              Close Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
