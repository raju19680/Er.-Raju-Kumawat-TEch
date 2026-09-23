'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
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
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  MessageSquare,
  Plus,
  Search,
  Copy,
  Trash2,
  Send,
  Eye,
  Clock,
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
  Loader2,
  Megaphone,
  CalendarDays,
  TrendingUp,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed'

interface Campaign {
  id: string
  title: string
  message: string
  templateName: string
  targetAudience: string
  status: CampaignStatus
  scheduledAt: string
  totalSent: number
  delivered: number
  read: number
  replied: number
  failed: number
  createdAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function mapApiCampaign(raw: Record<string, unknown>): Campaign {
  return {
    id: raw.id as string,
    title: raw.title as string,
    message: raw.message as string,
    templateName: (raw.templateName as string) || '',
    targetAudience: (raw.targetAudience as string) || '',
    status: (raw.status as CampaignStatus) || 'draft',
    scheduledAt: raw.scheduledAt ? new Date(raw.scheduledAt as string).toISOString().slice(0, 16) : '',
    totalSent: (raw.totalRecipients as number) || 0,
    delivered: (raw.deliveredCount as number) || 0,
    read: (raw.readCount as number) || 0,
    replied: (raw.repliedCount as number) || 0,
    failed: (raw.failedCount as number) || 0,
    createdAt: raw.createdAt ? new Date(raw.createdAt as string).toISOString().split('T')[0] : '',
  }
}

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Clock },
  scheduled: { label: 'Scheduled', color: 'bg-amber-50 text-amber-700', icon: CalendarDays },
  sending: { label: 'Sending', color: 'bg-sky-50 text-sky-700', icon: Send },
  completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-50 text-red-700', icon: XCircle },
}

const AUDIENCES = ['All Students', 'JEE Aspirants', 'NEET Students', 'Pending Payments', 'Active Subscribers', 'Trial Users']

// ─── Component ────────────────────────────────────────────────────────────

export default function WhatsappCampaignsPage() {
  const { orgCode } = useAppStore()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null)
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [formTemplate, setFormTemplate] = useState('')
  const [formAudience, setFormAudience] = useState('')
  const [formSchedule, setFormSchedule] = useState('')
  const [saving, setSaving] = useState(false)

  // ─── Fetch campaigns ────────────────────────────────────────────────────

  const fetchCampaigns = useCallback(async () => {
    if (!orgCode) return
    try {
      setLoading(true)
      const response = await apiFetch(`/api/teacher/whatsapp/campaigns?organizationId=${orgCode}`)
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      const data = await response.json()
      setCampaigns((data.items || []).map(mapApiCampaign))
    } catch {
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [orgCode])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  // Filtered campaigns
  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.templateName.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [campaigns, search, statusFilter])

  // Stats
  const totalCampaigns = campaigns.length
  const sentThisMonth = campaigns.filter((c) => c.status === 'completed' || c.status === 'sending').length
  const completedCampaigns = campaigns.filter((c) => c.status === 'completed')
  const avgReadRate = completedCampaigns.length > 0
    ? Math.round(completedCampaigns.reduce((a, c) => a + (c.delivered > 0 ? (c.read / c.delivered) * 100 : 0), 0) / completedCampaigns.length)
    : 0
  const avgReplyRate = completedCampaigns.length > 0
    ? Math.round(completedCampaigns.reduce((a, c) => a + (c.delivered > 0 ? (c.replied / c.delivered) * 100 : 0), 0) / completedCampaigns.length)
    : 0

  function resetForm() {
    setFormTitle('')
    setFormMessage('')
    setFormTemplate('')
    setFormAudience('')
    setFormSchedule('')
  }

  function openCreate() {
    resetForm()
    setEditCampaign(null)
    setShowCreate(true)
  }

  function openEdit(c: Campaign) {
    setFormTitle(c.title)
    setFormMessage(c.message)
    setFormTemplate(c.templateName)
    setFormAudience(c.targetAudience)
    setFormSchedule(c.scheduledAt)
    setEditCampaign(c)
    setShowCreate(true)
  }

  async function handleSave() {
    if (!formTitle.trim() || !formMessage.trim()) {
      toast.error('Title and message are required')
      return
    }
    setSaving(true)
    try {
      if (editCampaign) {
        // Update existing campaign
        const response = await apiFetch(`/api/teacher/whatsapp/campaigns/${editCampaign.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: formTitle,
            message: formMessage,
            templateName: formTemplate,
            targetAudience: formAudience,
            scheduledAt: formSchedule || null,
            organizationId: orgCode,
          }),
        })
        if (!response.ok) throw new Error('Failed to update campaign')
        const data = await response.json()
        const updated = mapApiCampaign(data.item as Record<string, unknown>)
        setCampaigns((prev) => prev.map((c) => c.id === editCampaign.id ? updated : c))
        toast.success('Campaign updated')
      } else {
        // Create new campaign
        const response = await apiFetch('/api/teacher/whatsapp/campaigns', {
          method: 'POST',
          body: JSON.stringify({
            title: formTitle,
            message: formMessage,
            templateName: formTemplate,
            targetAudience: formAudience,
            scheduledAt: formSchedule || null,
            organizationId: orgCode,
          }),
        })
        if (!response.ok) throw new Error('Failed to create campaign')
        const data = await response.json()
        const created = mapApiCampaign(data.item as Record<string, unknown>)
        setCampaigns((prev) => [created, ...prev])
        toast.success('Campaign created')
      }
      setShowCreate(false)
    } catch {
      toast.error(editCampaign ? 'Failed to update campaign' : 'Failed to create campaign')
    } finally {
      setSaving(false)
    }
  }

  async function handleDuplicate(c: Campaign) {
    try {
      const response = await apiFetch('/api/teacher/whatsapp/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          title: `${c.title} (Copy)`,
          message: c.message,
          templateName: c.templateName,
          targetAudience: c.targetAudience,
          status: 'draft',
          organizationId: orgCode,
        }),
      })
      if (!response.ok) throw new Error('Failed to duplicate campaign')
      const data = await response.json()
      const created = mapApiCampaign(data.item as Record<string, unknown>)
      setCampaigns((prev) => [created, ...prev])
      toast.success('Campaign duplicated')
    } catch {
      toast.error('Failed to duplicate campaign')
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await apiFetch(`/api/teacher/whatsapp/campaigns/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete campaign')
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
      setDetailCampaign(null)
      toast.success('Campaign deleted')
    } catch {
      toast.error('Failed to delete campaign')
    }
  }

  function formatDateTime(dt: string) {
    if (!dt) return '—'
    try {
      return new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    } catch {
      return dt
    }
  }

  // ─── Loading state ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">WhatsApp Campaigns</h1>
            <p className="text-muted-foreground text-sm">Create and manage WhatsApp broadcast campaigns</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Campaigns</h1>
          <p className="text-muted-foreground text-sm">Create and manage WhatsApp broadcast campaigns</p>
        </div>
        <Button onClick={openCreate} className="gap-2 w-fit">
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: totalCampaigns, icon: Megaphone, color: 'text-violet-600' },
          { label: 'Sent This Month', value: sentThisMonth, icon: Send, color: 'text-sky-600' },
          { label: 'Avg Read Rate', value: `${avgReadRate}%`, icon: Eye, color: 'text-emerald-600' },
          { label: 'Avg Reply Rate', value: `${avgReplyRate}%`, icon: TrendingUp, color: 'text-amber-600' },
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No campaigns found</p>
              <p className="text-sm">Create your first WhatsApp campaign to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Audience</TableHead>
                    <TableHead className="hidden lg:table-cell">Delivered</TableHead>
                    <TableHead className="hidden lg:table-cell">Read</TableHead>
                    <TableHead className="hidden lg:table-cell">Replied</TableHead>
                    <TableHead className="hidden sm:table-cell">Scheduled</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const sc = STATUS_CONFIG[c.status]
                    const StatusIcon = sc.icon
                    return (
                      <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailCampaign(c)}>
                        <TableCell className="pl-4 font-medium max-w-[200px] truncate">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span className="truncate">{c.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{c.templateName}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${sc.color} gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="flex items-center gap-1 text-sm">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {c.targetAudience}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {c.totalSent > 0 ? (
                            <span className="text-sm font-medium">{(c.delivered || 0).toLocaleString()}</span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {c.delivered > 0 ? (
                            <span className="text-sm font-medium">{(c.read || 0).toLocaleString()}</span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {c.delivered > 0 ? (
                            <span className="text-sm font-medium">{(c.replied || 0).toLocaleString()}</span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {formatDateTime(c.scheduledAt)}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)} title="Edit">
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(c)} title="Duplicate">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editCampaign ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
            <DialogDescription>
              {editCampaign ? 'Update campaign details' : 'Set up a new WhatsApp broadcast campaign'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Campaign Title *</Label>
              <Input
                placeholder="e.g. JEE Early Bird Offer"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea
                placeholder="Type your WhatsApp message here..."
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">{formMessage.length} characters</p>
            </div>
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                placeholder="e.g. promo_offer"
                value={formTemplate}
                onChange={(e) => setFormTemplate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={formAudience} onValueChange={setFormAudience}>
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Schedule Date & Time</Label>
              <Input
                type="datetime-local"
                value={formSchedule}
                onChange={(e) => setFormSchedule(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editCampaign ? 'Update' : 'Create'} Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailCampaign} onOpenChange={(open) => !open && setDetailCampaign(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {detailCampaign && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-500" />
                  {detailCampaign.title}
                </DialogTitle>
                <DialogDescription>
                  Campaign details and analytics
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-2">
                {/* Status + Audience */}
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className={STATUS_CONFIG[detailCampaign.status].color}>
                    {STATUS_CONFIG[detailCampaign.status].label}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {detailCampaign.targetAudience}
                  </span>
                </div>

                {/* Message */}
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  {detailCampaign.message}
                </div>

                {/* Template + Schedule */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Template</p>
                    <p className="font-medium">{detailCampaign.templateName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Scheduled</p>
                    <p className="font-medium">{formatDateTime(detailCampaign.scheduledAt)}</p>
                  </div>
                </div>

                {/* Stats Progress */}
                {(detailCampaign.status === 'completed' || detailCampaign.status === 'sending') && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Delivery Analytics</h4>
                    {[
                      { label: 'Delivered', value: detailCampaign.delivered, total: detailCampaign.totalSent, color: 'bg-sky-500' },
                      { label: 'Read', value: detailCampaign.read, total: detailCampaign.delivered, color: 'bg-emerald-500' },
                      { label: 'Replied', value: detailCampaign.replied, total: detailCampaign.delivered, color: 'bg-violet-500' },
                      { label: 'Failed', value: detailCampaign.failed, total: detailCampaign.totalSent, color: 'bg-red-500' },
                    ].map((stat) => (
                      <div key={stat.label} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{stat.label}</span>
                          <span className="font-medium">
                            {(stat.value || 0).toLocaleString()}
                            {stat.total > 0 && (
                              <span className="text-muted-foreground ml-1">
                                ({Math.round((stat.value / stat.total) * 100)}%)
                              </span>
                            )}
                          </span>
                        </div>
                        <Progress
                          value={stat.total > 0 ? (stat.value / stat.total) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => { openEdit(detailCampaign); setDetailCampaign(null) }}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDuplicate(detailCampaign)}>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Duplicate
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive ml-auto" onClick={() => handleDelete(detailCampaign.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
