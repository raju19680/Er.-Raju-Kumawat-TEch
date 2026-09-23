'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Megaphone,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Wrench,
  RefreshCw,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ────────────────────────────────────────────────────────────────────
interface Announcement {
  id: string
  title: string
  message: string
  type: string
  isActive: boolean
  startsAt: string
  expiresAt: string | null
  targetRole: string
  createdById: string | null
  createdByName: string | null
  createdAt: string
  updatedAt: string
}

interface Stats {
  active: number
  total: number
  expiringSoon: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getTypeBadge(type: string) {
  switch (type) {
    case 'warning':
      return { bg: 'bg-amber-100', text: 'text-amber-700', icon: <AlertTriangle className="size-3" /> }
    case 'success':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 className="size-3" /> }
    case 'maintenance':
      return { bg: 'bg-gray-100', text: 'text-gray-700', icon: <Wrench className="size-3" /> }
    default:
      return { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Info className="size-3" /> }
  }
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })
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

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [stats, setStats] = useState<Stats>({ active: 0, total: 0, expiringSoon: 0 })
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [formType, setFormType] = useState('info')
  const [formStartsAt, setFormStartsAt] = useState('')
  const [formExpiresAt, setFormExpiresAt] = useState('')
  const [formTargetRole, setFormTargetRole] = useState('all')
  const [formSubmitting, setFormSubmitting] = useState(false)

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/admin/announcements')
      const json = await res.json()
      if (json.success) {
        setAnnouncements(json.announcements)
        setStats(json.stats)
      }
    } catch {
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const resetForm = () => {
    setFormTitle('')
    setFormMessage('')
    setFormType('info')
    setFormStartsAt('')
    setFormExpiresAt('')
    setFormTargetRole('all')
  }

  const handleCreate = async () => {
    if (!formTitle.trim() || !formMessage.trim()) {
      toast.error('Title and message are required.')
      return
    }
    setFormSubmitting(true)
    try {
      const res = await apiFetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          message: formMessage.trim(),
          type: formType,
          startsAt: formStartsAt || undefined,
          expiresAt: formExpiresAt || undefined,
          targetRole: formTargetRole,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Announcement created!')
        setCreateOpen(false)
        resetForm()
        fetchAnnouncements()
      } else {
        toast.error(json.message || 'Failed to create announcement')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingAnnouncement) return
    if (!formTitle.trim() || !formMessage.trim()) {
      toast.error('Title and message are required.')
      return
    }
    setFormSubmitting(true)
    try {
      const res = await apiFetch('/api/admin/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAnnouncement.id,
          title: formTitle.trim(),
          message: formMessage.trim(),
          expiresAt: formExpiresAt || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Announcement updated!')
        setEditOpen(false)
        setEditingAnnouncement(null)
        resetForm()
        fetchAnnouncements()
      } else {
        toast.error(json.message || 'Failed to update announcement')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    setToggling(id)
    try {
      const res = await apiFetch('/api/admin/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(currentActive ? 'Announcement deactivated' : 'Announcement activated')
        fetchAnnouncements()
      } else {
        toast.error(json.message || 'Failed to toggle')
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
      const res = await apiFetch('/api/admin/announcements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Announcement deleted')
        fetchAnnouncements()
      } else {
        toast.error(json.message || 'Failed to delete')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setDeleting(null)
    }
  }

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormTitle(announcement.title)
    setFormMessage(announcement.message)
    setFormExpiresAt(announcement.expiresAt ? announcement.expiresAt.substring(0, 16) : '')
    setEditOpen(true)
  }

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
            <Megaphone className="size-6 text-amber-600" />
            Announcements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage platform-wide announcements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnnouncements}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                <Plus className="size-4" />
                Create Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
                <DialogDescription>
                  Create a new platform-wide announcement for users.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Title</Label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Announcement title"
                    className="bg-gray-50/80 border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Message</Label>
                  <Textarea
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder="Announcement message"
                    rows={4}
                    className="bg-gray-50/80 border-gray-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Type</Label>
                    <Select value={formType} onValueChange={setFormType}>
                      <SelectTrigger className="bg-gray-50/80 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Target Role</Label>
                    <Select value={formTargetRole} onValueChange={setFormTargetRole}>
                      <SelectTrigger className="bg-gray-50/80 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="teacher">Teachers</SelectItem>
                        <SelectItem value="student">Students</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={formStartsAt}
                      onChange={(e) => setFormStartsAt(e.target.value)}
                      className="bg-gray-50/80 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Expiry Date</Label>
                    <Input
                      type="datetime-local"
                      value={formExpiresAt}
                      onChange={(e) => setFormExpiresAt(e.target.value)}
                      className="bg-gray-50/80 border-gray-200"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm() }}>
                  Cancel
                </Button>
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleCreate}
                  disabled={formSubmitting}
                >
                  {formSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    'Create'
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
                    <p className="text-sm font-medium text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.active}</p>
                    <p className="text-xs text-emerald-600 mt-1">Currently visible</p>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-emerald-50">
                    <Eye className="size-6 text-emerald-600" />
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
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">All announcements</p>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-amber-50">
                    <Megaphone className="size-6 text-amber-600" />
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
                    <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.expiringSoon}</p>
                    <p className="text-xs text-amber-600 mt-1">Within 3 days</p>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-orange-50">
                    <Clock className="size-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>
      ) : announcements.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Megaphone className="size-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-base font-medium text-gray-900 mb-1">No announcements yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first announcement to notify users about important updates.
              </p>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="size-4" />
                Create Announcement
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {announcements.map((announcement) => {
              const typeBadge = getTypeBadge(announcement.type)
              const expired = isExpired(announcement.expiresAt)

              return (
                <motion.div
                  key={announcement.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -10 }}
                  layout
                >
                  <Card className={`border-0 shadow-sm ${!announcement.isActive || expired ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Type icon */}
                        <div className={`flex items-center justify-center size-10 rounded-lg shrink-0 ${typeBadge.bg}`}>
                          <Megaphone className={`size-5 ${typeBadge.text.replace('text-', 'text-')}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">{announcement.title}</h3>
                            <Badge className={`${typeBadge.bg} ${typeBadge.text} border-0 gap-1 text-xs`}>
                              {typeBadge.icon}
                              {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                            </Badge>
                            {announcement.isActive && !expired ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Active</Badge>
                            ) : expired ? (
                              <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">Expired</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">Inactive</Badge>
                            )}
                            <Badge variant="outline" className="text-xs capitalize">
                              {announcement.targetRole === 'all' ? 'All Users' : announcement.targetRole + 's'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{announcement.message}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              Starts: {formatShortDate(announcement.startsAt)}
                            </span>
                            {announcement.expiresAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                Expires: {formatShortDate(announcement.expiresAt)}
                              </span>
                            )}
                            {announcement.createdByName && (
                              <span>By: {announcement.createdByName}</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggle(announcement.id, announcement.isActive)}
                            disabled={toggling === announcement.id}
                            className={announcement.isActive ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
                          >
                            {toggling === announcement.id ? (
                              <RefreshCw className="size-4 animate-spin" />
                            ) : announcement.isActive ? (
                              <Eye className="size-4" />
                            ) : (
                              <EyeOff className="size-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(announcement)}
                            className="text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(announcement.id)}
                            disabled={deleting === announcement.id}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            {deleting === announcement.id ? (
                              <RefreshCw className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditingAnnouncement(null); resetForm() } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>
              Update the announcement details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Title</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="bg-gray-50/80 border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Message</Label>
              <Textarea
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                rows={4}
                className="bg-gray-50/80 border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Expiry Date</Label>
              <Input
                type="datetime-local"
                value={formExpiresAt}
                onChange={(e) => setFormExpiresAt(e.target.value)}
                className="bg-gray-50/80 border-gray-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setEditingAnnouncement(null); resetForm() }}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleEdit}
              disabled={formSubmitting}
            >
              {formSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </span>
              ) : (
                'Update'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
