'use client'

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  Send,
  Search,
  Clock,
  Users,
  Star,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Filter,
  Headphones,
  Circle,
  Loader2,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

type ChatStatus = 'waiting' | 'active' | 'resolved' | 'closed'
type Priority = 'low' | 'medium' | 'high' | 'urgent'

interface ChatMessage {
  id: string
  sender: string
  senderType: 'visitor' | 'agent'
  content: string
  timestamp: string
  createdAt?: string
}

interface Conversation {
  id: string
  visitorName: string
  subject: string
  status: ChatStatus
  priority: Priority
  assignedAgent: string
  createdAt: string
  messages: ChatMessage[]
  rating?: number
}

// ─── Constants ────────────────────────────────────────────────────────────

const AGENTS = ['Rajesh K.', 'Priya S.', 'Amit M.', 'Unassigned']

// ─── Helpers ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ChatStatus, { label: string; color: string; dot: string }> = {
  waiting: { label: 'Waiting', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  active: { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  resolved: { label: 'Resolved', color: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  closed: { label: 'Closed', color: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; icon: React.ElementType }> = {
  low: { label: 'Low', color: 'bg-slate-50 text-slate-600', icon: Circle },
  medium: { label: 'Medium', color: 'bg-amber-50 text-amber-700', icon: AlertTriangle },
  high: { label: 'High', color: 'bg-orange-50 text-orange-700', icon: AlertTriangle },
  urgent: { label: 'Urgent', color: 'bg-red-50 text-red-700', icon: AlertTriangle },
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase()
}

function mapApiConversation(apiItem: Record<string, unknown>): Conversation {
  const apiMessages = (apiItem.messages as Array<Record<string, unknown>>) || []
  const priority = (apiItem.priority as string) || 'medium'
  // Map 'normal' priority from DB to 'medium' for UI
  const mappedPriority: Priority = priority === 'normal' ? 'medium' : priority as Priority
  return {
    id: apiItem.id as string,
    visitorName: (apiItem.visitorName as string) || 'Unknown',
    subject: (apiItem.subject as string) || 'No subject',
    status: (apiItem.status as ChatStatus) || 'waiting',
    priority: mappedPriority,
    rating: (apiItem.rating as number) || undefined,
    assignedAgent: (apiItem.assignedName as string) || 'Unassigned',
    createdAt: apiItem.createdAt
      ? new Date(apiItem.createdAt as string).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '',
    messages: apiMessages.map((m) => ({
      id: m.id as string,
      sender: (m.senderName as string) || (m.sender as string) || 'Unknown',
      senderType: (m.sender as string) === 'agent' ? 'agent' as const : 'visitor' as const,
      content: (m.content as string) || '',
      timestamp: m.createdAt
        ? new Date(m.createdAt as string).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : '',
      createdAt: m.createdAt as string | undefined,
    })),
  }
}

// ─── Component ────────────────────────────────────────────────────────────

export default function ChatManagerPage() {
  const { userName, orgCode } = useAppStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(() => conversations.find((c) => c.id === selectedId) || null, [conversations, selectedId])

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/teacher/chat/conversations?organizationId=${orgCode}&limit=100`)
      const data = await response.json()
      if (data.items) {
        const mapped = data.items.map((item: Record<string, unknown>) => mapApiConversation(item))
        setConversations(mapped)
        setSelectedId((prev) => {
          if (!prev && mapped.length > 0) return mapped[0].id
          return prev
        })
      }
    } catch {
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [orgCode])

  useEffect(() => {
    if (orgCode) {
      fetchConversations()
    }
  }, [orgCode, fetchConversations])

  // Filter conversations
  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      const matchSearch = c.visitorName.toLowerCase().includes(search.toLowerCase()) ||
        c.subject.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      const matchPriority = priorityFilter === 'all' || c.priority === priorityFilter
      return matchSearch && matchStatus && matchPriority
    })
  }, [conversations, search, statusFilter, priorityFilter])

  // Stats
  const activeChats = conversations.filter((c) => c.status === 'active').length
  const waitingChats = conversations.filter((c) => c.status === 'waiting').length
  // Compute average wait time from conversations (time between first message and first agent response)
  const avgWaitTime = useMemo(() => {
    const activeConvs = conversations.filter(c => c.messages && c.messages.length > 1)
    if (activeConvs.length === 0) return '0m'
    let totalWait = 0
    let count = 0
    for (const conv of activeConvs) {
      const firstMsg = conv.messages[0]
      const firstAgentMsg = conv.messages.find((m: any) => m.sender === 'agent' || m.senderType === 'agent')
      if (firstMsg && firstAgentMsg && firstMsg.createdAt && firstAgentMsg.createdAt) {
        const wait = new Date(firstAgentMsg.createdAt).getTime() - new Date(firstMsg.createdAt).getTime()
        if (wait > 0) {
          totalWait += wait
          count++
        }
      }
    }
    if (count === 0) return '0m'
    const avgMs = totalWait / count
    const avgMin = Math.round(avgMs / 60000)
    return avgMin >= 60 ? `${Math.floor(avgMin / 60)}h ${avgMin % 60}m` : `${avgMin}m`
  }, [conversations])

  // Compute satisfaction from resolved conversations with ratings
  const satisfactionRating = useMemo(() => {
    const rated = conversations.filter(c => c.status === 'resolved' && c.rating)
    if (rated.length === 0) return '—'
    const avg = rated.reduce((sum, c) => sum + (c.rating || 0), 0) / rated.length
    return avg.toFixed(1)
  }, [conversations])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages.length])

  async function handleSendMessage() {
    if (!messageInput.trim() || !selectedId) return
    const content = messageInput.trim()
    setSendingMessage(true)
    try {
      const response = await apiFetch('/api/teacher/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: selectedId,
          content,
          sender: 'agent',
          senderName: userName || 'Agent',
          type: 'text',
          organizationId: orgCode,
        }),
      })
      const data = await response.json()
      if (data.success) {
        // Optimistically add message to UI
        const newMsg: ChatMessage = {
          id: data.item?.id || Date.now().toString(),
          sender: userName || 'Agent',
          senderType: 'agent',
          content,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        }
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedId ? { ...c, messages: [...c.messages, newMsg] } : c
          )
        )
        setMessageInput('')
      } else {
        toast.error(data.error || 'Failed to send message')
      }
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  async function handleAssignAgent(conversationId: string, agent: string) {
    try {
      const response = await apiFetch(`/api/teacher/chat/conversations/${conversationId}`, {
        method: 'PUT',
        body: JSON.stringify({
          assignedTo: agent === 'Unassigned' ? null : agent,
          assignedName: agent,
          organizationId: orgCode,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, assignedAgent: agent, status: c.status === 'waiting' ? 'active' : c.status } : c
          )
        )
        toast.success(`Assigned to ${agent}`)
      } else {
        toast.error(data.error || 'Failed to assign agent')
      }
    } catch {
      toast.error('Failed to assign agent')
    }
  }

  async function handleChangePriority(conversationId: string, priority: Priority) {
    try {
      const response = await apiFetch(`/api/teacher/chat/conversations/${conversationId}`, {
        method: 'PUT',
        body: JSON.stringify({ priority, organizationId: orgCode }),
      })
      const data = await response.json()
      if (data.success) {
        setConversations((prev) =>
          prev.map((c) => c.id === conversationId ? { ...c, priority } : c)
        )
        toast.success(`Priority changed to ${priority}`)
      } else {
        toast.error(data.error || 'Failed to change priority')
      }
    } catch {
      toast.error('Failed to change priority')
    }
  }

  async function handleResolve(conversationId: string) {
    try {
      const response = await apiFetch(`/api/teacher/chat/conversations/${conversationId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'resolved', organizationId: orgCode }),
      })
      const data = await response.json()
      if (data.success) {
        setConversations((prev) =>
          prev.map((c) => c.id === conversationId ? { ...c, status: 'resolved' } : c)
        )
        toast.success('Conversation resolved')
      } else {
        toast.error(data.error || 'Failed to resolve conversation')
      }
    } catch {
      toast.error('Failed to resolve conversation')
    }
  }

  async function handleClose(conversationId: string) {
    try {
      const response = await apiFetch(`/api/teacher/chat/conversations/${conversationId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'closed', organizationId: orgCode }),
      })
      const data = await response.json()
      if (data.success) {
        setConversations((prev) =>
          prev.map((c) => c.id === conversationId ? { ...c, status: 'closed' } : c)
        )
        toast.success('Conversation closed')
      } else {
        toast.error(data.error || 'Failed to close conversation')
      }
    } catch {
      toast.error('Failed to close conversation')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chat Manager</h1>
          <p className="text-muted-foreground text-sm">Manage live chat support conversations</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chat Manager</h1>
        <p className="text-muted-foreground text-sm">Manage live chat support conversations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Chats', value: activeChats, icon: MessageSquare, color: 'text-emerald-600' },
          { label: 'Waiting', value: waitingChats, icon: Clock, color: 'text-amber-600' },
          { label: 'Avg Wait Time', value: avgWaitTime, icon: HourglassIcon, color: 'text-sky-600' },
          { label: 'Satisfaction', value: `${satisfactionRating} ★`, icon: Star, color: 'text-violet-600' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-320px)] min-h-[500px]">
        {/* Left sidebar - Conversation list */}
        <Card className="lg:col-span-4 flex flex-col">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2 flex-1 overflow-hidden flex flex-col">
            {/* Search + Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conversation list */}
            <ScrollArea className="flex-1">
              <div className="space-y-1.5 pr-1">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">No conversations</p>
                  </div>
                ) : (
                  filtered.map((conv) => {
                    const sc = STATUS_CONFIG[conv.status]
                    const pc = PRIORITY_CONFIG[conv.priority]
                    const lastMsg = conv.messages[conv.messages.length - 1]
                    const isSelected = conv.id === selectedId
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedId(conv.id)}
                        className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                          isSelected ? 'border-primary/50 bg-primary/5' : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="text-xs bg-muted">{getInitials(conv.visitorName)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{conv.visitorName}</p>
                              <p className="text-xs text-muted-foreground truncate">{conv.subject}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={`${sc.color} text-xs shrink-0 h-5`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} mr-1`} />
                            {sc.label}
                          </Badge>
                        </div>
                        {lastMsg && (
                          <p className="text-xs text-muted-foreground mt-1.5 truncate pl-10">
                            {lastMsg.senderType === 'agent' ? 'You: ' : ''}{lastMsg.content}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 pl-10">
                          <Badge variant="secondary" className={`${pc.color} text-xs h-4 px-1.5`}>
                            {pc.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{conv.createdAt}</span>
                          {conv.assignedAgent !== 'Unassigned' && (
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <UserCheck className="h-2.5 w-2.5" />
                              {conv.assignedAgent}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right panel - Chat messages */}
        <Card className="lg:col-span-8 flex flex-col">
          {selected ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-sm bg-muted">{getInitials(selected.visitorName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm">{selected.visitorName}</h3>
                    <p className="text-xs text-muted-foreground">{selected.subject}</p>
                  </div>
                  <Badge variant="outline" className={`${STATUS_CONFIG[selected.status].color} text-xs h-5`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selected.status].dot} mr-1`} />
                    {STATUS_CONFIG[selected.status].label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={selected.assignedAgent} onValueChange={(v) => handleAssignAgent(selected.id, v)}>
                    <SelectTrigger className="h-8 text-xs w-32">
                      <UserCheck className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENTS.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selected.priority} onValueChange={(v) => handleChangePriority(selected.id, v as Priority)}>
                    <SelectTrigger className="h-8 text-xs w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  {selected.status !== 'resolved' && selected.status !== 'closed' && (
                    <>
                      <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => handleResolve(selected.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Resolve
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => handleClose(selected.id)}>
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Close
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selected.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                          msg.senderType === 'agent'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.senderType === 'agent' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                        }`}>
                          {msg.sender} · {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Send message */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !sendingMessage && handleSendMessage()}
                    className="flex-1"
                    disabled={selected.status === 'closed' || sendingMessage}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || selected.status === 'closed' || sendingMessage}
                    size="icon"
                  >
                    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                {selected.status === 'closed' && (
                  <p className="text-xs text-muted-foreground mt-1.5 text-center">This conversation is closed</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Headphones className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm">Choose a chat from the left to start messaging</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// Simple hourglass icon component
function HourglassIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 3h14" /><path d="M7 21h10" /><path d="M6 3v2a8 8 0 0 0 4 7 8 8 0 0 0-4 7v2" /><path d="M18 3v2a8 8 0 0 1-4 7 8 8 0 0 1 4 7v2" />
    </svg>
  )
}
