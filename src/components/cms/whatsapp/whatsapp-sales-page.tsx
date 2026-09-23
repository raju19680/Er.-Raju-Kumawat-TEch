'use client'

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageCircle,
  Send,
  Search,
  Clock,
  Users,
  TrendingUp,
  Bot,
  User,
  CheckCircle,
  Filter,
  Zap,
  Phone,
  Loader2,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

type ConversationStatus = 'open' | 'closed' | 'bot'

interface Message {
  id: string
  conversationId: string
  sender: 'contact' | 'agent' | 'bot'
  text: string
  time: string
  createdAt: string
}

interface Conversation {
  id: string
  contactName: string
  contactPhone: string
  status: ConversationStatus
  unreadCount: number
  lastMessage: string
  lastMessageTime: string
  converted: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin} min ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr} hr ago`
    const diffDay = Math.floor(diffHr / 24)
    return `${diffDay}d ago`
  } catch {
    return dateStr
  }
}

function formatMessageTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch {
    return dateStr
  }
}

function mapApiConversation(raw: Record<string, unknown>): Conversation {
  const tags = typeof raw.tags === 'string' ? raw.tags : null
  let converted = false
  if (tags) {
    try {
      const parsed = JSON.parse(tags)
      converted = Array.isArray(parsed) && parsed.includes('converted')
    } catch {
      converted = tags === 'converted'
    }
  }
  return {
    id: raw.id as string,
    contactName: raw.contactName as string,
    contactPhone: raw.contactPhone as string,
    status: (raw.status as ConversationStatus) || 'open',
    unreadCount: (raw.unreadCount as number) || 0,
    lastMessage: (raw.lastMessage as string) || '',
    lastMessageTime: formatTimeAgo(raw.lastMessageAt as string),
    converted,
  }
}

function mapApiMessages(messages: Record<string, unknown>[]): Message[] {
  return messages.map((m) => ({
    id: m.id as string,
    conversationId: m.conversationId as string,
    sender: (m.sender as 'contact' | 'agent' | 'bot') || 'contact',
    text: m.content as string,
    time: formatMessageTime(m.createdAt as string),
    createdAt: (m.createdAt as string) || '',
  }))
}

const QUICK_REPLIES = [
  { id: '1', title: '👋 Greeting', message: 'Hello! Thank you for reaching out. How can I help you today?' },
  { id: '2', title: '📚 Course Info', message: 'Here are the details about our courses. Would you like to know about JEE, NEET, or Board exam preparation?' },
  { id: '3', title: '💳 Payment Help', message: 'For payment, you can use our secure payment page. Let me share the link with you!' },
  { id: '4', title: '🏷️ Discount', message: 'Great news! Use code FIRST100 for ₹100 off on your first purchase. Valid for all courses!' },
  { id: '5', title: '✅ Enrollment', message: 'To enroll, simply visit our course page and click "Buy Now". You\'ll get instant access after payment!' },
]

// ─── Component ────────────────────────────────────────────────────────────

export default function WhatsAppSalesPage() {
  const { orgCode } = useAppStore()

  // Data
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [loading, setLoading] = useState(true)

  // UI State
  const [selectedConversationId, setSelectedConversationId] = useState<string>('')
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // ─── Fetch conversations ─────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    if (!orgCode) return
    try {
      setLoading(true)
      const response = await apiFetch(`/api/teacher/whatsapp/conversations?organizationId=${orgCode}`)
      if (!response.ok) throw new Error('Failed to fetch conversations')
      const data = await response.json()
      const mapped = (data.items || []).map(mapApiConversation)
      setConversations(mapped)

      // Build messages map from embedded messages
      const msgsMap: Record<string, Message[]> = {}
      for (const item of data.items || []) {
        const rawMsgs = (item as Record<string, unknown>).messages
        if (Array.isArray(rawMsgs) && rawMsgs.length > 0) {
          msgsMap[item.id as string] = mapApiMessages(rawMsgs as Record<string, unknown>[])
        }
      }
      setMessages(msgsMap)

      // Auto-select first conversation if none selected
      if (mapped.length > 0) {
        setSelectedConversationId((prev) => prev || mapped[0].id)
      }
    } catch {
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [orgCode])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // ─── Scroll to bottom ──────────────────────────────────────────────────

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, selectedConversationId])

  // ─── Filtered conversations ────────────────────────────────────────────

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchesSearch = c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactPhone.includes(searchQuery)
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [conversations, searchQuery, statusFilter])

  // ─── Stats ─────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const activeChats = conversations.filter((c) => c.status === 'open').length
    const unread = conversations.reduce((acc, c) => acc + c.unreadCount, 0)
    const converted = conversations.filter((c) => c.converted).length

    // Compute average response time from actual message timestamps
    let totalWaitMs = 0
    let waitCount = 0
    for (const conv of conversations) {
      const convMessages = messages[conv.id]
      if (!convMessages || convMessages.length === 0) continue
      const firstContactMsg = convMessages.find((m) => m.sender === 'contact')
      const firstAgentMsg = convMessages.find((m) => m.sender === 'agent')
      if (firstContactMsg?.createdAt && firstAgentMsg?.createdAt) {
        const wait = new Date(firstAgentMsg.createdAt).getTime() - new Date(firstContactMsg.createdAt).getTime()
        if (wait > 0) {
          totalWaitMs += wait
          waitCount++
        }
      }
    }
    let avgResponseTime = '—'
    if (waitCount > 0) {
      const avgMin = Math.round(totalWaitMs / waitCount / 60000)
      avgResponseTime = avgMin >= 60 ? `${Math.floor(avgMin / 60)}h ${avgMin % 60}m` : `${avgMin}m`
    }

    return { activeChats, unread, avgResponseTime, converted }
  }, [conversations, messages])

  // ─── Selected conversation ─────────────────────────────────────────────

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId)
  const selectedMessages = messages[selectedConversationId] || []

  // ─── Send message ──────────────────────────────────────────────────────

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversationId || sendingMessage) return

    const content = messageInput.trim()
    setSendingMessage(true)

    try {
      const response = await apiFetch('/api/teacher/whatsapp/conversations', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: selectedConversationId,
          content,
          sender: 'agent',
          type: 'text',
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()
      const newMsg = data.item as Record<string, unknown>

      // Add message to local state
      const mappedMsg: Message = {
        id: newMsg.id as string,
        conversationId: selectedConversationId,
        sender: 'agent',
        text: content,
        time: formatMessageTime(newMsg.createdAt as string),
        createdAt: (newMsg.createdAt as string) || new Date().toISOString(),
      }

      setMessages((prev) => ({
        ...prev,
        [selectedConversationId]: [...(prev[selectedConversationId] || []), mappedMsg],
      }))

      // Update conversation last message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversationId
            ? { ...c, lastMessage: content, lastMessageTime: 'Just now' }
            : c
        )
      )

      setMessageInput('')
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  // ─── Quick reply ───────────────────────────────────────────────────────

  const handleQuickReply = (message: string) => {
    setMessageInput(message)
  }

  // ─── Select conversation ───────────────────────────────────────────────

  const selectConversation = async (id: string) => {
    setSelectedConversationId(id)
    setMobileShowChat(true)

    // Mark as read locally
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    )

    // Mark as read via API
    try {
      await apiFetch(`/api/teacher/whatsapp/conversations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ unreadCount: 0 }),
      })
    } catch {
      // Silently fail - local state is already updated
    }
  }

  // ─── Mark as converted ────────────────────────────────────────────────

  const markAsConverted = async (conv: Conversation) => {
    try {
      const newTags = conv.converted ? '[]' : '["converted"]'
      await apiFetch(`/api/teacher/whatsapp/conversations/${conv.id}`, {
        method: 'PUT',
        body: JSON.stringify({ tags: newTags }),
      })
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conv.id ? { ...c, converted: !conv.converted } : c
        )
      )
      toast.success(conv.converted ? 'Unmarked as converted' : 'Marked as converted')
    } catch {
      toast.error('Failed to update conversation')
    }
  }

  // ─── Change status ───────────────────────────────────────────────────

  const changeStatus = async (conv: Conversation, newStatus: ConversationStatus) => {
    try {
      await apiFetch(`/api/teacher/whatsapp/conversations/${conv.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conv.id ? { ...c, status: newStatus } : c
        )
      )
      toast.success(`Status changed to ${newStatus}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  // ─── Status helpers ────────────────────────────────────────────────────

  const getStatusIcon = (status: ConversationStatus) => {
    switch (status) {
      case 'open':
        return <MessageCircle className="size-3 text-emerald-500" />
      case 'closed':
        return <CheckCircle className="size-3 text-gray-400" />
      case 'bot':
        return <Bot className="size-3 text-sky-500" />
    }
  }

  const getStatusColor = (status: ConversationStatus) => {
    switch (status) {
      case 'open':
        return 'bg-emerald-50 text-emerald-700'
      case 'closed':
        return 'bg-gray-100 text-gray-600'
      case 'bot':
        return 'bg-sky-50 text-sky-700'
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Sales</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage conversations and convert leads to students
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Sales</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage conversations and convert leads to students
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-emerald-50">
              <MessageCircle className="size-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Chats</p>
              <p className="text-lg font-bold text-gray-900">{stats.activeChats}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-amber-50">
              <Users className="size-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unread</p>
              <p className="text-lg font-bold text-gray-900">{stats.unread}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-violet-50">
              <Clock className="size-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Response</p>
              <p className="text-lg font-bold text-gray-900">{stats.avgResponseTime}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-rose-50">
              <TrendingUp className="size-4 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Converted</p>
              <p className="text-lg font-bold text-gray-900">{stats.converted}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-320px)] min-h-[500px]">
        {/* Left Sidebar - Conversations */}
        <div className={`lg:col-span-4 xl:col-span-3 ${mobileShowChat ? 'hidden lg:block' : 'block'}`}>
          <Card className="rounded-xl bg-white shadow-sm h-full flex flex-col overflow-hidden">
            {/* Search & Filter */}
            <CardContent className="p-3 border-b space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <Filter className="size-3 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="bot">Bot</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
                    <MessageCircle className="size-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No conversations</p>
                  <p className="text-xs text-muted-foreground mt-1">No chats match your filter</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                        selectedConversationId === conv.id ? 'bg-gray-50 border-l-2 border-l-black' : ''
                      }`}
                      onClick={() => selectConversation(conv.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="size-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">
                            {conv.contactName.split(' ').map((n) => n[0]).join('')}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm text-gray-900 truncate">
                              {conv.contactName}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {conv.lastMessageTime}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground truncate">
                              {conv.lastMessage}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              {conv.unreadCount > 0 && (
                                <span className="flex items-center justify-center size-5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                                  {conv.unreadCount}
                                </span>
                              )}
                              {getStatusIcon(conv.status)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge className={`${getStatusColor(conv.status)} text-xs h-4 px-1.5`}>
                              {conv.status === 'bot' && <Bot className="size-2.5 mr-0.5" />}
                              {conv.status.charAt(0).toUpperCase() + conv.status.slice(1)}
                            </Badge>
                            {conv.converted && (
                              <Badge className="bg-emerald-50 text-emerald-700 text-xs h-4 px-1.5">
                                <TrendingUp className="size-2.5 mr-0.5" />
                                Converted
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Panel - Chat */}
        <div className={`lg:col-span-8 xl:col-span-9 ${!mobileShowChat ? 'hidden lg:block' : 'block'}`}>
          <Card className="rounded-xl bg-white shadow-sm h-full flex flex-col overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3 border-b flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 lg:hidden"
                      onClick={() => setMobileShowChat(false)}
                    >
                      ←
                    </Button>
                    <div className="size-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {selectedConversation.contactName.split(' ').map((n) => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{selectedConversation.contactName}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{selectedConversation.contactPhone}</p>
                        <Badge className={`${getStatusColor(selectedConversation.status)} text-xs h-4 px-1.5`}>
                          {selectedConversation.status.charAt(0).toUpperCase() + selectedConversation.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => markAsConverted(selectedConversation)}
                    >
                      <TrendingUp className="size-3.5 mr-1" />
                      {selectedConversation.converted ? 'Unconvert' : 'Convert'}
                    </Button>
                    <Select
                      value={selectedConversation.status}
                      onValueChange={(val) => changeStatus(selectedConversation, val as ConversationStatus)}
                    >
                      <SelectTrigger className="h-8 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="bot">Bot</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" className="h-9 w-8 p-0">
                      <Phone className="size-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {selectedMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="size-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No messages yet</p>
                    </div>
                  ) : (
                    selectedMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                            msg.sender === 'agent'
                              ? 'bg-emerald-600 text-white rounded-br-md'
                              : 'bg-white border text-gray-900 rounded-bl-md shadow-sm'
                          }`}
                        >
                          {msg.sender === 'bot' && (
                            <div className="flex items-center gap-1 mb-1">
                              <Bot className="size-3 text-sky-500" />
                              <span className="text-xs font-medium text-sky-600">
                                Bot
                              </span>
                            </div>
                          )}
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.sender === 'agent' ? 'text-emerald-200' : 'text-muted-foreground'
                            }`}
                          >
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Replies */}
                <div className="px-3 py-2 border-t bg-white">
                  <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {QUICK_REPLIES.map((qr) => (
                      <Button
                        key={qr.id}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs whitespace-nowrap shrink-0"
                        onClick={() => handleQuickReply(qr.message)}
                      >
                        <Zap className="size-3 mr-1" />
                        {qr.title}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Send Input */}
                <div className="p-3 border-t bg-white">
                  <div className="flex items-center gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 h-10 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      disabled={sendingMessage}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sendingMessage}
                      className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white px-4"
                    >
                      {sendingMessage ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MessageCircle className="size-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-gray-900">Select a conversation</p>
                <p className="text-xs text-muted-foreground mt-1">Choose a chat from the sidebar to start messaging</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
