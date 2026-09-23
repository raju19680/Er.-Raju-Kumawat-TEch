'use client'

import React, { useState, useMemo } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Plus,
  Users,
  Settings,
  Send,
  Clock,
  Search,
  Trash2,
  Loader2,
  Hash,
  Volume2,
  VolumeX,
  Circle,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

interface ChatRoom {
  id: string
  name: string
  participants: number
  lastMessage: string
  lastMessageTime: string
  status: 'active' | 'archived'
  unread: number
}

interface ChatMessage {
  id: string
  sender: string
  content: string
  timestamp: string
  isOwn: boolean
}

// ─── Component ────────────────────────────────────────────────────────────

export default function ChatManagerPage() {
  // Rooms state
  const [rooms, setRooms] = useState<ChatRoom[]>([
    { id: '1', name: 'General Support', participants: 12, lastMessage: 'How do I reset my password?', lastMessageTime: '2m ago', status: 'active', unread: 3 },
    { id: '2', name: 'Course Discussion', participants: 45, lastMessage: 'The new module is great!', lastMessageTime: '15m ago', status: 'active', unread: 0 },
    { id: '3', name: 'Payment Issues', participants: 8, lastMessage: 'My payment failed twice', lastMessageTime: '1h ago', status: 'active', unread: 1 },
    { id: '4', name: 'Announcements', participants: 120, lastMessage: 'New test series launching tomorrow', lastMessageTime: '3h ago', status: 'active', unread: 0 },
    { id: '5', name: 'Old Support Channel', participants: 5, lastMessage: 'Archived for reference', lastMessageTime: '2d ago', status: 'archived', unread: 0 },
  ])

  // Selected room
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchRooms, setSearchRooms] = useState('')

  // Messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Student 1', content: 'How do I reset my password?', timestamp: '10:30 AM', isOwn: false },
    { id: '2', sender: 'You', content: 'You can reset it from the login page. Click "Forgot Password" and follow the steps.', timestamp: '10:32 AM', isOwn: true },
    { id: '3', sender: 'Student 1', content: 'I tried but I\'m not getting the email', timestamp: '10:33 AM', isOwn: false },
    { id: '4', sender: 'You', content: 'Let me check your account. Can you share your registered email?', timestamp: '10:34 AM', isOwn: true },
    { id: '5', sender: 'Student 1', content: 'student@example.com', timestamp: '10:35 AM', isOwn: false },
  ])

  // Create room dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [creating, setCreating] = useState(false)

  // Settings tab
  const [widgetEnabled, setWidgetEnabled] = useState(true)
  const [widgetPosition, setWidgetPosition] = useState('bottom-right')
  const [welcomeMessage, setWelcomeMessage] = useState('Hi! How can we help you today?')
  const [awayMessage, setAwayMessage] = useState('We\'re currently offline. Please leave a message and we\'ll get back to you.')

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    if (!searchRooms) return rooms
    const q = searchRooms.toLowerCase()
    return rooms.filter((r) => r.name.toLowerCase().includes(q))
  }, [rooms, searchRooms])

  // ─── Create Room ─────────────────────────────────────────────────────

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      toast.error('Room name is required')
      return
    }
    setCreating(true)
    setTimeout(() => {
      const newRoom: ChatRoom = {
        id: Date.now().toString(),
        name: roomName.trim(),
        participants: 1,
        lastMessage: 'Room created',
        lastMessageTime: 'Just now',
        status: 'active',
        unread: 0,
      }
      setRooms((prev) => [newRoom, ...prev])
      setCreateDialogOpen(false)
      setRoomName('')
      setCreating(false)
      toast.success('Chat room created')
    }, 500)
  }

  // ─── Send Message ────────────────────────────────────────────────────

  const handleSendMessage = () => {
    if (!messageInput.trim()) return
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'You',
      content: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    }
    setMessages((prev) => [...prev, newMsg])
    setMessageInput('')
  }

  // ─── Delete Room ─────────────────────────────────────────────────────

  const handleDeleteRoom = (roomId: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== roomId))
    if (selectedRoom?.id === roomId) {
      setSelectedRoom(null)
    }
    toast.success('Chat room deleted')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chat Manager</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage chat rooms, conversations, and widget settings
        </p>
      </div>

      <Tabs defaultValue="rooms" className="space-y-6">
        <div className="w-full overflow-x-auto">
          <TabsList className="inline-flex w-max min-w-full">
            <TabsTrigger value="rooms" className="gap-1.5">
              <MessageSquare className="size-3.5" />
              Chat Rooms
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5">
              <Hash className="size-3.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="size-3.5" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── Chat Rooms Tab ────────────────────────────────────────── */}
        <TabsContent value="rooms" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={searchRooms}
                onChange={(e) => setSearchRooms(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-black hover:bg-gray-800 text-white">
              <Plus className="size-4 mr-2" /> Create Room
            </Button>
          </div>

          {filteredRooms.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <MessageSquare className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No chat rooms</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first chat room</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredRooms.map((room) => (
                <Card
                  key={room.id}
                  className={`rounded-xl cursor-pointer hover:shadow-md transition-all ${
                    selectedRoom?.id === room.id ? 'ring-2 ring-amber-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedRoom(room)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                          <Hash className="size-4 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-gray-900 truncate">{room.name}</p>
                            {room.unread > 0 && (
                              <Badge className="bg-amber-500 text-white text-xs h-5 min-w-[20px] flex items-center justify-center rounded-full">
                                {room.unread}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{room.lastMessage}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="size-3" />
                            {room.participants}
                          </div>
                          <p className="text-xs text-muted-foreground">{room.lastMessageTime}</p>
                        </div>
                        <Badge className={room.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}>
                          {room.status === 'active' ? (
                            <><Circle className="size-2 fill-emerald-500 mr-1" /> Active</>
                          ) : (
                            'Archived'
                          )}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRoom(room.id)
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Chat Tab ──────────────────────────────────────────────── */}
        <TabsContent value="chat">
          {!selectedRoom ? (
            <Card className="rounded-xl">
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <MessageSquare className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No room selected</p>
                  <p className="text-xs text-muted-foreground mt-1">Select a chat room from the Chat Rooms tab</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-amber-50 flex items-center justify-center">
                    <Hash className="size-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{selectedRoom.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedRoom.participants} participants</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[80%] ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="size-7 shrink-0">
                          <AvatarFallback className={`text-xs font-medium ${msg.isOwn ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                            {msg.isOwn ? 'Y' : msg.sender[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className={`rounded-xl px-3 py-2 text-sm ${msg.isOwn ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
                            {msg.content}
                          </div>
                          <p className={`text-xs text-muted-foreground mt-0.5 ${msg.isOwn ? 'text-right' : ''}`}>
                            {msg.isOwn ? '' : `${msg.sender} • `}{msg.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Send Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} className="bg-black hover:bg-gray-800 text-white" size="sm">
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ─── Settings Tab ─────────────────────────────────────────── */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg">Chat Widget Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <Switch checked={widgetEnabled} onCheckedChange={setWidgetEnabled} />
                <Label>{widgetEnabled ? 'Widget Enabled' : 'Widget Disabled'}</Label>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Widget Position</Label>
                <div className="flex gap-3">
                  {['bottom-right', 'bottom-left'].map((pos) => (
                    <Button
                      key={pos}
                      variant={widgetPosition === pos ? 'default' : 'outline'}
                      size="sm"
                      className={widgetPosition === pos ? 'bg-black hover:bg-gray-800 text-white' : ''}
                      onClick={() => setWidgetPosition(pos)}
                    >
                      {pos.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Welcome Message</Label>
                <Textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Away Message</Label>
                <Textarea
                  value={awayMessage}
                  onChange={(e) => setAwayMessage(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>

              <Button onClick={() => toast.success('Widget settings saved')} className="bg-black hover:bg-gray-800 text-white">
                Save Settings
              </Button>
            </CardContent>
          </Card>

          {/* Widget Preview */}
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg">Widget Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-xl p-4 bg-gray-50 relative min-h-[200px]">
                <div className={`absolute ${widgetPosition === 'bottom-right' ? 'right-4 bottom-4' : 'left-4 bottom-4'}`}>
                  {widgetEnabled && (
                    <div className="bg-white rounded-xl shadow-lg border w-72 overflow-hidden">
                      <div className="bg-amber-500 text-white p-3">
                        <p className="font-medium text-sm">💬 Chat Support</p>
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="bg-gray-100 rounded-lg p-2 text-xs">
                          {welcomeMessage}
                        </div>
                        <div className="flex">
                          <Input placeholder="Type a message..." className="h-8 text-xs" disabled />
                          <Button size="sm" className="ml-1 h-8 bg-amber-500 hover:bg-amber-600">
                            <Send className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Create Room Dialog ────────────────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Chat Room</DialogTitle>
            <DialogDescription>Add a new chat room for your platform</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Room Name</Label>
              <Input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. General Support"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button className="bg-black hover:bg-gray-800 text-white" onClick={handleCreateRoom} disabled={creating}>
              {creating && <Loader2 className="size-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
