'use client'

import React, { useState } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  MessageCircle,
  Phone,
  Send,
  Plus,
  Copy,
  ExternalLink,
  Clock,
  Users,
  Megaphone,
  QrCode,
  Link2,
  Loader2,
  Trash2,
  CheckCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

interface QuickReply {
  id: string
  title: string
  message: string
}

interface Campaign {
  id: string
  title: string
  message: string
  targetAudience: string
  status: 'draft' | 'scheduled' | 'sent'
  scheduledAt: string | null
  createdAt: string
}

// ─── Component ────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  // Sales Tab State
  const [businessNumber, setBusinessNumber] = useState('')
  const [whatsappEnabled, setWhatsappEnabled] = useState(false)
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([
    { id: '1', title: 'Greeting', message: 'Hello! Thank you for reaching out. How can we help you today?' },
    { id: '2', title: 'Course Info', message: 'Here are the details about our courses. Would you like to enroll?' },
    { id: '3', title: 'Payment Help', message: 'For payment issues, please share your order ID and we will assist you promptly.' },
  ])
  const [replyDrawerOpen, setReplyDrawerOpen] = useState(false)
  const [editReply, setEditReply] = useState<QuickReply | null>(null)
  const [replyTitle, setReplyTitle] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [savingReply, setSavingReply] = useState(false)

  // Link Generator
  const [linkPhoneNumber, setLinkPhoneNumber] = useState('')
  const [linkMessage, setLinkMessage] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')

  // Campaigns Tab State
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      title: 'New Course Launch',
      message: '🎉 Exciting news! Our new JEE Advanced course is now live. Enroll today and get 20% off!',
      targetAudience: 'all_students',
      status: 'sent',
      scheduledAt: null,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '2',
      title: 'Weekend Test Reminder',
      message: '📋 Reminder: Your weekend test series starts this Saturday at 10 AM. Prepare well!',
      targetAudience: 'test_students',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 172800000).toISOString(),
      createdAt: new Date().toISOString(),
    },
  ])
  const [campaignDrawerOpen, setCampaignDrawerOpen] = useState(false)
  const [campaignTitle, setCampaignTitle] = useState('')
  const [campaignMessage, setCampaignMessage] = useState('')
  const [campaignTarget, setCampaignTarget] = useState('all_students')
  const [campaignSchedule, setCampaignSchedule] = useState('')
  const [savingCampaign, setSavingCampaign] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'reply' | 'campaign'; id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ─── Quick Reply Handlers ─────────────────────────────────────────────

  const openAddReply = () => {
    setEditReply(null)
    setReplyTitle('')
    setReplyMessage('')
    setReplyDrawerOpen(true)
  }

  const openEditReply = (reply: QuickReply) => {
    setEditReply(reply)
    setReplyTitle(reply.title)
    setReplyMessage(reply.message)
    setReplyDrawerOpen(true)
  }

  const handleSaveReply = () => {
    if (!replyTitle.trim() || !replyMessage.trim()) {
      toast.error('Title and message are required')
      return
    }
    setSavingReply(true)
    // Simulate save
    setTimeout(() => {
      if (editReply) {
        setQuickReplies((prev) =>
          prev.map((r) => (r.id === editReply.id ? { ...r, title: replyTitle, message: replyMessage } : r))
        )
        toast.success('Quick reply updated')
      } else {
        const newReply: QuickReply = {
          id: Date.now().toString(),
          title: replyTitle,
          message: replyMessage,
        }
        setQuickReplies((prev) => [...prev, newReply])
        toast.success('Quick reply added')
      }
      setReplyDrawerOpen(false)
      setSavingReply(false)
    }, 500)
  }

  // ─── Link Generator ──────────────────────────────────────────────────

  const generateLink = () => {
    if (!linkPhoneNumber) {
      toast.error('Phone number is required')
      return
    }
    const phone = linkPhoneNumber.replace(/[^0-9]/g, '')
    const msg = encodeURIComponent(linkMessage)
    const link = `https://wa.me/${phone}${msg ? `?text=${msg}` : ''}`
    setGeneratedLink(link)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink)
    toast.success('Link copied to clipboard')
  }

  // ─── Campaign Handlers ────────────────────────────────────────────────

  const openAddCampaign = () => {
    setCampaignTitle('')
    setCampaignMessage('')
    setCampaignTarget('all_students')
    setCampaignSchedule('')
    setCampaignDrawerOpen(true)
  }

  const handleSaveCampaign = () => {
    if (!campaignTitle.trim() || !campaignMessage.trim()) {
      toast.error('Title and message are required')
      return
    }
    setSavingCampaign(true)
    setTimeout(() => {
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        title: campaignTitle,
        message: campaignMessage,
        targetAudience: campaignTarget,
        status: campaignSchedule ? 'scheduled' : 'draft',
        scheduledAt: campaignSchedule || null,
        createdAt: new Date().toISOString(),
      }
      setCampaigns((prev) => [newCampaign, ...prev])
      setCampaignDrawerOpen(false)
      setSavingCampaign(false)
      toast.success(campaignSchedule ? 'Campaign scheduled' : 'Campaign saved as draft')
    }, 500)
  }

  // ─── Delete Handler ──────────────────────────────────────────────────

  const handleDelete = () => {
    if (!deleteTarget) return
    setDeleting(true)
    setTimeout(() => {
      if (deleteTarget.type === 'reply') {
        setQuickReplies((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      } else {
        setCampaigns((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      }
      toast.success('Deleted successfully')
      setDeleting(false)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }, 300)
  }

  // ─── Status Helpers ──────────────────────────────────────────────────

  const CAMPAIGN_STATUS: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
    scheduled: { label: 'Scheduled', color: 'bg-amber-50 text-amber-700' },
    sent: { label: 'Sent', color: 'bg-emerald-50 text-emerald-700' },
  }

  const AUDIENCE_LABELS: Record<string, string> = {
    all_students: 'All Students',
    test_students: 'Test Students',
    course_students: 'Course Students',
    new_students: 'New Students',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage WhatsApp integration, quick replies, and campaigns
        </p>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <div className="w-full overflow-x-auto">
          <TabsList className="inline-flex w-max min-w-full">
            <TabsTrigger value="sales" className="gap-1.5">
              <MessageCircle className="size-3.5" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5">
              <Megaphone className="size-3.5" />
              Campaigns
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── Sales Tab ──────────────────────────────────────────────── */}
        <TabsContent value="sales" className="space-y-6">
          {/* Business Number Config */}
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="size-5" />
                WhatsApp Business Number
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
                <Label>{whatsappEnabled ? 'Enabled' : 'Disabled'}</Label>
              </div>
              <div className="space-y-2">
                <Label>Business Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={businessNumber}
                    onChange={(e) => setBusinessNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="pl-9"
                    disabled={!whatsappEnabled}
                  />
                </div>
              </div>
              {whatsappEnabled && businessNumber && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <CheckCircle className="size-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700">WhatsApp integration active for {businessNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Reply Templates */}
          <Card className="rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="size-5" />
                  Quick Reply Templates
                </CardTitle>
                <Button onClick={openAddReply} size="sm" className="bg-black hover:bg-gray-800 text-white">
                  <Plus className="size-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {quickReplies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Send className="size-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No templates yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create quick reply templates</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quickReplies.map((reply) => (
                    <div key={reply.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-900">{reply.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{reply.message}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditReply(reply)}>
                          <Send className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-600"
                          onClick={() => {
                            setDeleteTarget({ type: 'reply', id: reply.id, name: reply.title })
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Link Generator */}
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Link2 className="size-5" />
                WhatsApp Link Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={linkPhoneNumber}
                  onChange={(e) => setLinkPhoneNumber(e.target.value)}
                  placeholder="919876543210"
                />
                <p className="text-xs text-muted-foreground">Country code + number (e.g., 919876543210)</p>
              </div>
              <div className="space-y-2">
                <Label>Pre-filled Message</Label>
                <Textarea
                  value={linkMessage}
                  onChange={(e) => setLinkMessage(e.target.value)}
                  placeholder="Hi, I'm interested in your courses..."
                  className="min-h-[60px]"
                />
              </div>
              <Button onClick={generateLink} className="w-full bg-black hover:bg-gray-800 text-white">
                <Link2 className="size-4 mr-2" /> Generate Link
              </Button>

              {generatedLink && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
                  <p className="text-xs font-medium text-amber-700">Generated Link:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-white px-2 py-1 rounded border flex-1 break-all">
                      {generatedLink}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0">
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Campaigns Tab ──────────────────────────────────────────── */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex sm:justify-end">
            <Button onClick={openAddCampaign} className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white">
              <Plus className="size-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          {campaigns.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Megaphone className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No campaigns yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first WhatsApp campaign</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden md:table-cell">Target</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Schedule</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => {
                        const statusCfg = CAMPAIGN_STATUS[campaign.status] || CAMPAIGN_STATUS.draft
                        return (
                          <TableRow key={campaign.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{campaign.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {campaign.message}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                                <Users className="size-3 mr-1" />
                                {AUDIENCE_LABELS[campaign.targetAudience] || campaign.targetAudience}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                              {campaign.scheduledAt
                                ? new Date(campaign.scheduledAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600"
                                onClick={() => {
                                  setDeleteTarget({ type: 'campaign', id: campaign.id, name: campaign.title })
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Quick Reply Drawer ────────────────────────────────────────── */}
      <Sheet open={replyDrawerOpen} onOpenChange={setReplyDrawerOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editReply ? 'Edit Quick Reply' : 'Add Quick Reply'}</SheetTitle>
            <SheetDescription>Create a template for quick responses</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={replyTitle} onChange={(e) => setReplyTitle(e.target.value)} placeholder="e.g. Greeting" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your quick reply message..."
                className="min-h-[120px]"
              />
            </div>
          </div>
          <SheetFooter className="border-t pt-4">
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setReplyDrawerOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-black hover:bg-gray-800 text-white" onClick={handleSaveReply} disabled={savingReply}>
                {savingReply && <Loader2 className="size-4 animate-spin mr-2" />}
                Save
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── Campaign Drawer ───────────────────────────────────────────── */}
      <Sheet open={campaignDrawerOpen} onOpenChange={setCampaignDrawerOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Campaign</SheetTitle>
            <SheetDescription>Set up a WhatsApp message campaign</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)} placeholder="Campaign title" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={campaignMessage}
                onChange={(e) => setCampaignMessage(e.target.value)}
                placeholder="Your campaign message..."
                className="min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={campaignTarget} onValueChange={setCampaignTarget}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_students">All Students</SelectItem>
                  <SelectItem value="test_students">Test Students</SelectItem>
                  <SelectItem value="course_students">Course Students</SelectItem>
                  <SelectItem value="new_students">New Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Schedule (optional)</Label>
              <Input
                type="datetime-local"
                value={campaignSchedule}
                onChange={(e) => setCampaignSchedule(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Leave empty to save as draft</p>
            </div>
          </div>
          <SheetFooter className="border-t pt-4">
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setCampaignDrawerOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-black hover:bg-gray-800 text-white" onClick={handleSaveCampaign} disabled={savingCampaign}>
                {savingCampaign && <Loader2 className="size-4 animate-spin mr-2" />}
                {campaignSchedule ? 'Schedule' : 'Save Draft'}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── Delete Dialog ─────────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="size-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
