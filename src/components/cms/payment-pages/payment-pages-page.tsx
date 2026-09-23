'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Search,
  Eye,
  Copy,
  ExternalLink,
  Layout,
  Globe,
  IndianRupee,
  BarChart3,
  MousePointerClick,
  CheckCircle,
  Loader2,
  Filter,
  Link2,
  FileText,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

type TemplateType = 'default' | 'minimal' | 'detailed'
type PageStatus = 'published' | 'draft' | 'archived'

interface PaymentPage {
  id: string
  title: string
  description: string
  amount: number
  buttonLabel: string
  redirectUrl: string
  template: TemplateType
  imageUrl: string | null
  status: PageStatus
  viewCount: number
  paymentCount: number
  createdAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const TEMPLATE_BADGE: Record<TemplateType, { label: string; color: string }> = {
  default: { label: 'Default', color: 'bg-violet-50 text-violet-700' },
  minimal: { label: 'Minimal', color: 'bg-sky-50 text-sky-700' },
  detailed: { label: 'Detailed', color: 'bg-amber-50 text-amber-700' },
}

const STATUS_BADGE: Record<PageStatus, { label: string; color: string }> = {
  published: { label: 'Published', color: 'bg-emerald-50 text-emerald-700' },
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
  archived: { label: 'Archived', color: 'bg-red-50 text-red-600' },
}

// ─── Component ────────────────────────────────────────────────────────────

export default function PaymentPagesPage() {
  const { orgCode } = useAppStore()

  // Data
  const [pages, setPages] = useState<PaymentPage[]>([])
  const [loading, setLoading] = useState(true)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTemplate, setFilterTemplate] = useState<string>('all')

  // Add/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPage, setEditPage] = useState<PaymentPage | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pageToDelete, setPageToDelete] = useState<PaymentPage | null>(null)

  // Preview dialog
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewPage, setPreviewPage] = useState<PaymentPage | null>(null)

  // Form
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formButtonLabel, setFormButtonLabel] = useState('')
  const [formRedirectUrl, setFormRedirectUrl] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formTemplate, setFormTemplate] = useState<TemplateType>('default')
  const [formStatus, setFormStatus] = useState<PageStatus>('draft')

  // ─── Data Fetching ────────────────────────────────────────────────────

  const fetchPages = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (orgCode) params.set('organizationId', orgCode)
      if (searchQuery) params.set('search', searchQuery)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      const response = await apiFetch(`/api/teacher/payment-pages?${params.toString()}`)
      const data = await response.json()
      if (data.items) {
        setPages(data.items)
      }
    } catch (error) {
      console.error('Failed to fetch payment pages:', error)
      toast.error('Failed to load payment pages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPages()
  }, [searchQuery, filterStatus, orgCode])

  // ─── Filtered Data ─────────────────────────────────────────────────────

  const filteredPages = useMemo(() => {
    return pages.filter((p) => {
      const matchesTemplate = filterTemplate === 'all' || p.template === filterTemplate
      return matchesTemplate
    })
  }, [pages, filterTemplate])

  // ─── Stats ─────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalPages = pages.length
    const published = pages.filter((p) => p.status === 'published').length
    const totalPayments = pages.reduce((acc, p) => acc + p.paymentCount, 0)
    const revenue = pages.reduce((acc, p) => acc + p.amount * p.paymentCount, 0)
    return { totalPages, published, totalPayments, revenue }
  }, [pages])

  // ─── Form helpers ──────────────────────────────────────────────────────

  const resetForm = () => {
    setFormTitle('')
    setFormDescription('')
    setFormAmount('')
    setFormButtonLabel('Pay Now')
    setFormRedirectUrl('')
    setFormImageUrl('')
    setFormTemplate('default')
    setFormStatus('draft')
  }

  const openAddDialog = () => {
    setEditPage(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (page: PaymentPage) => {
    setEditPage(page)
    setFormTitle(page.title)
    setFormDescription(page.description || '')
    setFormAmount(String(page.amount))
    setFormButtonLabel(page.buttonLabel)
    setFormRedirectUrl(page.redirectUrl || '')
    setFormImageUrl(page.imageUrl || '')
    setFormTemplate(page.template)
    setFormStatus(page.status)
    setDialogOpen(true)
  }

  // ─── Image Upload ────────────────────────────────────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/teacher/upload-image?type=image', {
        method: 'POST',
        body: formData,
      })
      
      const data = await res.json()
      if (data.success) {
        setFormImageUrl(data.url)
        toast.success('Image uploaded successfully')
      } else {
        toast.error(data.error || 'Failed to upload image')
      }
    } catch (err) {
      toast.error('Network error during upload')
    } finally {
      setUploading(false)
    }
  }

  // ─── Save ──────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast.error('Title is required')
      return
    }
    if (!formAmount || Number(formAmount) <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }
    if (!formButtonLabel.trim()) {
      toast.error('Button label is required')
      return
    }
    setSaving(true)
    try {
      if (editPage) {
        const response = await apiFetch(`/api/teacher/payment-pages/${editPage.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDescription.trim(),
            amount: Number(formAmount),
            buttonLabel: formButtonLabel.trim(),
            redirectUrl: formRedirectUrl.trim(),
            imageUrl: formImageUrl.trim() || null,
            template: formTemplate,
            status: formStatus,
          }),
        })
        if (!response.ok) throw new Error('Failed to update')
        toast.success('Payment page updated')
      } else {
        const response = await apiFetch('/api/teacher/payment-pages', {
          method: 'POST',
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDescription.trim(),
            amount: Number(formAmount),
            buttonLabel: formButtonLabel.trim(),
            redirectUrl: formRedirectUrl.trim(),
            imageUrl: formImageUrl.trim() || null,
            template: formTemplate,
            status: formStatus,
            organizationId: orgCode,
          }),
        })
        if (!response.ok) throw new Error('Failed to create')
        toast.success('Payment page created')
      }
      setDialogOpen(false)
      fetchPages()
    } catch (error) {
      console.error('Failed to save payment page:', error)
      toast.error('Failed to save payment page')
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete ────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!pageToDelete) return
    try {
      const response = await apiFetch(`/api/teacher/payment-pages/${pageToDelete.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Payment page deleted')
      setDeleteDialogOpen(false)
      setPageToDelete(null)
      fetchPages()
    } catch (error) {
      console.error('Failed to delete payment page:', error)
      toast.error('Failed to delete payment page')
    }
  }

  // ─── Copy link ─────────────────────────────────────────────────────────

  const copyLink = (page: PaymentPage) => {
    const link = `https://${orgCode || 'demo'}.learnapp.in/pay/${page.id}`
    navigator.clipboard.writeText(link)
    toast.success('Payment link copied to clipboard')
  }

  // ─── Preview ───────────────────────────────────────────────────────────

  const openPreview = (page: PaymentPage) => {
    setPreviewPage(page)
    setPreviewDialogOpen(true)
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Pages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage payment collection pages
          </p>
        </div>
        <Button onClick={openAddDialog} className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white">
          <Plus className="size-4 mr-2" />
          Add Payment Page
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-violet-50">
              <FileText className="size-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Pages</p>
              <p className="text-lg font-bold text-gray-900">{stats.totalPages}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-emerald-50">
              <Globe className="size-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Published</p>
              <p className="text-lg font-bold text-gray-900">{stats.published}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-amber-50">
              <MousePointerClick className="size-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Payments</p>
              <p className="text-lg font-bold text-gray-900">{stats.totalPayments.toLocaleString('en-IN')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-rose-50">
              <BarChart3 className="size-4 text-rose-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-lg font-bold text-gray-900">₹{stats.revenue.toLocaleString('en-IN')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="rounded-xl bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title..."
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="size-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTemplate} onValueChange={setFilterTemplate}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Layout className="size-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {filteredPages.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <CreditCard className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-gray-900">No payment pages found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || filterStatus !== 'all' || filterTemplate !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first payment page'}
              </p>
              {!searchQuery && filterStatus === 'all' && filterTemplate === 'all' && (
                <Button onClick={openAddDialog} className="mt-4 bg-black hover:bg-gray-800 text-white" size="sm">
                  <Plus className="size-4 mr-2" /> Add Payment Page
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPages.map((page) => {
            const templateBadge = TEMPLATE_BADGE[page.template]
            const statusBadge = STATUS_BADGE[page.status]
            const conversionRate = page.viewCount > 0 ? ((page.paymentCount / page.viewCount) * 100).toFixed(1) : '0'
            return (
              <Card key={page.id} className="rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow group">
                <CardContent className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">{page.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{page.description}</p>
                    </div>
                    <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-2xl font-bold text-gray-900">
                      <IndianRupee className="size-5" />
                      {page.amount.toLocaleString('en-IN')}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {page.buttonLabel}
                    </Badge>
                  </div>

                  {/* Template Badge */}
                  <div className="flex items-center gap-2">
                    <Badge className={templateBadge.color}>
                      <Layout className="size-3 mr-1" />
                      {templateBadge.label}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Views</p>
                      <p className="text-sm font-semibold">{page.viewCount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Payments</p>
                      <p className="text-sm font-semibold">{page.paymentCount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Conv.</p>
                      <p className="text-sm font-semibold">{conversionRate}%</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={() => openPreview(page)}
                    >
                      <Eye className="size-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={() => copyLink(page)}
                    >
                      <Link2 className="size-3 mr-1" />
                      Copy Link
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={() => openEditDialog(page)}
                    >
                      <Pencil className="size-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8 text-red-600 hover:text-red-700"
                      onClick={() => {
                        setPageToDelete(page)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="size-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── Add/Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPage ? 'Edit Payment Page' : 'Add Payment Page'}</DialogTitle>
            <DialogDescription>
              {editPage ? 'Update payment page details' : 'Create a new payment collection page'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. JEE Course Fee"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe what the student gets..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Button Label *</Label>
                <Input
                  value={formButtonLabel}
                  onChange={(e) => setFormButtonLabel(e.target.value)}
                  placeholder="Pay Now"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Redirect URL</Label>
              <Input
                value={formRedirectUrl}
                onChange={(e) => setFormRedirectUrl(e.target.value)}
                placeholder="https://example.com/thank-you"
              />
              <p className="text-xs text-muted-foreground">Where to redirect after successful payment</p>
            </div>

            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div className="flex gap-2">
                <Input
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                />
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Button type="button" variant="outline" disabled={uploading}>
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : 'Upload'}
                  </Button>
                </div>
              </div>
              {formImageUrl && (
                <div className="mt-2 rounded-lg border overflow-hidden bg-gray-50 max-w-[200px] aspect-video">
                  <img
                    src={formImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={formTemplate} onValueChange={(v) => setFormTemplate(v as TemplateType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as PageStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-black hover:bg-gray-800 text-white" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}
              {editPage ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Preview Dialog ──────────────────────────────────────────────── */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Page Preview</DialogTitle>
            <DialogDescription>
              How your payment page will look to students
            </DialogDescription>
          </DialogHeader>

          {previewPage && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="border rounded-xl overflow-hidden shadow-md">
                {previewPage.imageUrl && (
                  <div className="w-full h-40 bg-gray-100 overflow-hidden">
                    <MediaImage src={previewPage.imageUrl} alt={previewPage.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center">
                  <h3 className="text-xl font-bold">{previewPage.title}</h3>
                  <p className="text-sm opacity-90 mt-1">{previewPage.description}</p>
                </div>
                <div className="p-6 bg-white space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-3xl font-bold text-gray-900">₹{previewPage.amount.toLocaleString('en-IN')}</p>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CreditCard className="size-3.5" />
                    Secure payment powered by Razorpay
                  </div>
                  <Button className="w-full bg-black hover:bg-gray-800 text-white">
                    {previewPage.buttonLabel}
                  </Button>
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle className="size-3 text-emerald-500" />
                    Secure & encrypted payment
                  </div>
                </div>
              </div>

              {/* Template badge */}
              <div className="flex items-center justify-center gap-2">
                <Badge className={TEMPLATE_BADGE[previewPage.template].color}>
                  <Layout className="size-3 mr-1" />
                  {TEMPLATE_BADGE[previewPage.template].label} Template
                </Badge>
                <Badge className={STATUS_BADGE[previewPage.status].color}>
                  {STATUS_BADGE[previewPage.status].label}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>Close</Button>
            {previewPage && (
              <Button className="bg-black hover:bg-gray-800 text-white" onClick={() => { copyLink(previewPage); setPreviewDialogOpen(false) }}>
                <Copy className="size-4 mr-2" />
                Copy Link
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Dialog ───────────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{pageToDelete?.title}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
