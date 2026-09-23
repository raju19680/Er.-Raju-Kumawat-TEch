'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Code,
  Layers,
  CheckCircle2,
  XCircle,
  Search,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ────────────────────────────────────────────────────────────────────
interface EmailTemplate {
  id: string
  key: string
  name: string
  subject: string
  body: string
  variables: string | null
  category: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Stats {
  total: number
  active: number
  byCategory: Record<string, number>
}

// ── Animation variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Category colors ──────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-100 text-gray-700',
  auth: 'bg-blue-50 text-blue-700',
  payment: 'bg-emerald-50 text-emerald-700',
  notification: 'bg-amber-50 text-amber-700',
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  auth: 'Auth',
  payment: 'Payment',
  notification: 'Notification',
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, byCategory: {} })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Toggling state
  const [toggling, setToggling] = useState<string | null>(null)

  // Form state
  const [formKey, setFormKey] = useState('')
  const [formName, setFormName] = useState('')
  const [formSubject, setFormSubject] = useState('')
  const [formBody, setFormBody] = useState('')
  const [formVariables, setFormVariables] = useState('')
  const [formCategory, setFormCategory] = useState('general')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const fetchTemplates = useCallback(async (category?: string) => {
    setLoading(true)
    try {
      const url = category && category !== 'all'
        ? `/api/admin/email-templates?category=${category}`
        : '/api/admin/email-templates'
      const res = await apiFetch(url)
      const json = await res.json()
      if (json.success) {
        setTemplates(json.templates)
        setStats(json.stats)
      }
    } catch {
      toast.error('Failed to load email templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const resetForm = () => {
    setFormKey('')
    setFormName('')
    setFormSubject('')
    setFormBody('')
    setFormVariables('')
    setFormCategory('general')
    setFormIsActive(true)
    setEditingTemplate(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setFormKey(template.key)
    setFormName(template.name)
    setFormSubject(template.subject)
    setFormBody(template.body)
    setFormVariables(template.variables || '')
    setFormCategory(template.category)
    setFormIsActive(template.isActive)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formKey.trim() || !formName.trim() || !formSubject.trim() || !formBody.trim()) {
      toast.error('Key, name, subject, and body are required.')
      return
    }

    setFormSubmitting(true)
    try {
      if (editingTemplate) {
        // Update existing
        const res = await apiFetch('/api/admin/email-templates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingTemplate.id,
            name: formName.trim(),
            subject: formSubject.trim(),
            body: formBody,
            variables: formVariables.trim() || null,
            isActive: formIsActive,
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Email template updated!')
          setDialogOpen(false)
          resetForm()
          fetchTemplates(categoryFilter)
        } else {
          toast.error(json.message || 'Failed to update email template')
        }
      } else {
        // Create new
        const res = await apiFetch('/api/admin/email-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: formKey.trim(),
            name: formName.trim(),
            subject: formSubject.trim(),
            body: formBody,
            variables: formVariables.trim() || null,
            category: formCategory,
            isActive: formIsActive,
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Email template created!')
          setDialogOpen(false)
          resetForm()
          fetchTemplates(categoryFilter)
        } else {
          toast.error(json.message || 'Failed to create email template')
        }
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setToggling(id)
    try {
      const res = await apiFetch('/api/admin/email-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(currentActive ? 'Template deactivated' : 'Template activated')
        fetchTemplates(categoryFilter)
      } else {
        toast.error(json.message || 'Failed to toggle template')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await apiFetch('/api/admin/email-templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Email template deleted')
        setDeleteConfirm(null)
        fetchTemplates(categoryFilter)
      } else {
        toast.error(json.message || 'Failed to delete template')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setDeleting(null)
    }
  }

  const handleCategoryFilterChange = (category: string) => {
    setCategoryFilter(category)
    fetchTemplates(category)
  }

  // Parse variables from comma-separated string
  const parseVariables = (variablesStr: string | null): string[] => {
    if (!variablesStr) return []
    try {
      // Try parsing as JSON array first
      const parsed = JSON.parse(variablesStr)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {
      // Fall back to comma-separated
    }
    return variablesStr
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  }

  // Filter templates by search query (client-side)
  const filteredTemplates = templates.filter((t) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      t.name.toLowerCase().includes(q) ||
      t.key.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    )
  })

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="size-6 text-amber-600" />
            Email Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage email templates for notifications and communications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTemplates(categoryFilter)}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                onClick={openCreateDialog}
              >
                <Plus className="size-4" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
                </DialogTitle>
                <DialogDescription>
                  {editingTemplate
                    ? 'Update the email template details below.'
                    : 'Define a new email template for system communications.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Key */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Key</Label>
                  <Input
                    value={formKey}
                    onChange={(e) => setFormKey(e.target.value.replace(/\s/g, '_').toLowerCase())}
                    placeholder="e.g. welcome_email"
                    className="bg-gray-50/80 border-gray-200 font-mono text-sm"
                    disabled={!!editingTemplate}
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifier (auto-lowered, spaces → underscores). Cannot be changed after creation.
                  </p>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Name</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Welcome Email"
                    className="bg-gray-50/80 border-gray-200"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Subject Line</Label>
                  <Input
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g. Welcome to {{orgName}}!"
                    className="bg-gray-50/80 border-gray-200"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {'{{variable}}'} syntax for dynamic values
                  </p>
                </div>

                {/* Body */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Body (HTML)</Label>
                  <Textarea
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    placeholder={'<h1>Hello {{userName}}</h1>\n<p>Welcome to our platform!</p>'}
                    className="bg-gray-50/80 border-gray-200 font-mono text-sm min-h-[200px]"
                    rows={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    HTML template body with {'{{variable}}'} placeholders
                  </p>
                </div>

                {/* Variables */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Available Variables</Label>
                  <Input
                    value={formVariables}
                    onChange={(e) => setFormVariables(e.target.value)}
                    placeholder="e.g. userName, orgName, courseName"
                    className="bg-gray-50/80 border-gray-200"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated list of variables available in this template
                  </p>
                </div>

                {/* Category & Active */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category</Label>
                    <Select
                      value={formCategory}
                      onValueChange={setFormCategory}
                      disabled={!!editingTemplate}
                    >
                      <SelectTrigger className="bg-gray-50/80 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="auth">Auth</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex items-center gap-3 h-10 px-3 rounded-md border border-gray-200 bg-gray-50/80">
                      <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                      <span className="text-sm text-gray-600">{formIsActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                  Cancel
                </Button>
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleSave}
                  disabled={formSubmitting}
                >
                  {formSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {editingTemplate ? 'Saving...' : 'Creating...'}
                    </span>
                  ) : (
                    editingTemplate ? 'Save Changes' : 'Create'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">All email templates</p>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-amber-50">
                    <Mail className="size-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Templates</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
                    <p className="text-xs text-muted-foreground mt-1">Currently in use</p>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-emerald-50">
                    <CheckCircle2 className="size-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {Object.keys(stats.byCategory).length}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(stats.byCategory).map(([cat, count]) => (
                        <span key={cat} className="text-xs text-muted-foreground">
                          {CATEGORY_LABELS[cat] || cat}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-gray-100">
                    <Layers className="size-6 text-gray-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Filters Row */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-9 bg-white border-gray-200"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'general', 'auth', 'payment', 'notification'].map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              size="sm"
              className={categoryFilter === cat ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
              onClick={() => handleCategoryFilterChange(cat)}
            >
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] || cat}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Templates List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Mail className="size-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-base font-medium text-gray-900 mb-1">No email templates</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== 'all'
                  ? 'No templates match your current filters.'
                  : 'Create your first email template to get started.'}
              </p>
              {!searchQuery && categoryFilter === 'all' && (
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  onClick={openCreateDialog}
                >
                  <Plus className="size-4" />
                  Create Template
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredTemplates.map((template) => {
              const vars = parseVariables(template.variables)
              return (
                <motion.div
                  key={template.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -10 }}
                  layout
                >
                  <Card className={`border-0 shadow-sm transition-colors ${template.isActive ? 'ring-1 ring-emerald-100' : ''}`}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        {/* Template icon */}
                        <div className={`flex items-center justify-center size-11 rounded-lg shrink-0 ${template.isActive ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                          <Mail className={`size-5 ${template.isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Top row: name, key, badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">{template.name}</h3>
                            <code className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                              {template.key}
                            </code>
                            <Badge className={`${CATEGORY_COLORS[template.category] || 'bg-gray-100 text-gray-700'} border-0 text-xs`}>
                              {CATEGORY_LABELS[template.category] || template.category}
                            </Badge>
                            <Badge className={`${template.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'} border-0 text-xs`}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          {/* Subject line preview */}
                          <p className="text-sm text-gray-700 font-medium truncate">
                            {template.subject}
                          </p>

                          {/* Body preview (truncated) */}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 150)}
                            {template.body.length > 150 && '...'}
                          </p>

                          {/* Variables */}
                          {vars.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <Code className="size-3 text-muted-foreground" />
                              {vars.map((v) => (
                                <Badge
                                  key={v}
                                  variant="outline"
                                  className="text-xs font-mono px-1.5 py-0 h-5 text-gray-500 border-gray-200"
                                >
                                  {`{{${v}}}`}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Toggle active */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(template.id, template.isActive)}
                            disabled={toggling === template.id}
                            className={`gap-1.5 ${template.isActive ? 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                            title={template.isActive ? 'Deactivate template' : 'Activate template'}
                          >
                            {toggling === template.id ? (
                              <RefreshCw className="size-4 animate-spin" />
                            ) : template.isActive ? (
                              <Eye className="size-4" />
                            ) : (
                              <EyeOff className="size-4" />
                            )}
                            <span className="text-xs hidden sm:inline">
                              {toggling === template.id ? '' : template.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </Button>

                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(template)}
                            className="text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                            title="Edit template"
                          >
                            <Edit className="size-4" />
                          </Button>

                          {/* Delete */}
                          {deleteConfirm === template.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs h-8"
                                onClick={() => handleDelete(template.id)}
                                disabled={deleting === template.id}
                              >
                                {deleting === template.id ? (
                                  <RefreshCw className="size-3 animate-spin" />
                                ) : (
                                  'Confirm'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8"
                                onClick={() => setDeleteConfirm(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(template.id)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                              title="Delete template"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
