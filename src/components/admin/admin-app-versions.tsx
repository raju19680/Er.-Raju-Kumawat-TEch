'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Smartphone,
  Tablet,
  Monitor,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Download,
  Tag,
  Package,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ────────────────────────────────────────────────────────────────────
interface AppVersion {
  id: string
  version: string
  platform: string
  changelog: string | null
  downloadUrl: string | null
  isForceUpdate: boolean
  isActive: boolean
  releasedAt: string
  createdAt: string
  updatedAt: string
}

interface VersionStats {
  total: number
  active: number
  byPlatform: {
    android: number
    ios: number
    web: number
  }
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

// ── Helpers ──────────────────────────────────────────────────────────────────
function getPlatformIcon(platform: string) {
  switch (platform) {
    case 'android':
      return <Smartphone className="size-5" />
    case 'ios':
      return <Tablet className="size-5" />
    case 'web':
      return <Monitor className="size-5" />
    default:
      return <Smartphone className="size-5" />
  }
}

function getPlatformColor(platform: string) {
  switch (platform) {
    case 'android':
      return 'bg-emerald-50 text-emerald-600'
    case 'ios':
      return 'bg-blue-50 text-blue-600'
    case 'web':
      return 'bg-purple-50 text-purple-600'
    default:
      return 'bg-gray-50 text-gray-600'
  }
}

function getPlatformBadgeColor(platform: string) {
  switch (platform) {
    case 'android':
      return 'bg-emerald-100 text-emerald-700'
    case 'ios':
      return 'bg-blue-100 text-blue-700'
    case 'web':
      return 'bg-purple-100 text-purple-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminAppVersionsPage() {
  const [versions, setVersions] = useState<AppVersion[]>([])
  const [stats, setStats] = useState<VersionStats>({
    total: 0,
    active: 0,
    byPlatform: { android: 0, ios: 0, web: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [platformFilter, setPlatformFilter] = useState('all')

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  // Form state
  const [formVersion, setFormVersion] = useState('')
  const [formPlatform, setFormPlatform] = useState('android')
  const [formChangelog, setFormChangelog] = useState('')
  const [formDownloadUrl, setFormDownloadUrl] = useState('')
  const [formForceUpdate, setFormForceUpdate] = useState(false)
  const [formIsActive, setFormIsActive] = useState(true)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const fetchVersions = useCallback(async () => {
    setLoading(true)
    try {
      const url = platformFilter && platformFilter !== 'all'
        ? `/api/admin/app-versions?platform=${platformFilter}`
        : '/api/admin/app-versions'
      const res = await apiFetch(url)
      const json = await res.json()
      if (json.success) {
        setVersions(json.versions)
        setStats(json.stats)
      }
    } catch {
      toast.error('Failed to load app versions')
    } finally {
      setLoading(false)
    }
  }, [platformFilter])

  useEffect(() => {
    fetchVersions()
  }, [fetchVersions])

  const resetForm = () => {
    setFormVersion('')
    setFormPlatform('android')
    setFormChangelog('')
    setFormDownloadUrl('')
    setFormForceUpdate(false)
    setFormIsActive(true)
    setEditingVersion(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setEditingVersion(null)
    setDialogOpen(true)
  }

  const openEditDialog = (version: AppVersion) => {
    setEditingVersion(version)
    setFormVersion(version.version)
    setFormPlatform(version.platform)
    setFormChangelog(version.changelog || '')
    setFormDownloadUrl(version.downloadUrl || '')
    setFormForceUpdate(version.isForceUpdate)
    setFormIsActive(version.isActive)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formVersion.trim()) {
      toast.error('Version number is required.')
      return
    }
    setFormSubmitting(true)
    try {
      if (editingVersion) {
        // Update existing
        const res = await apiFetch('/api/admin/app-versions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingVersion.id,
            version: formVersion.trim(),
            changelog: formChangelog.trim() || undefined,
            downloadUrl: formDownloadUrl.trim() || undefined,
            isForceUpdate: formForceUpdate,
            isActive: formIsActive,
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Version updated successfully!')
          setDialogOpen(false)
          resetForm()
          fetchVersions()
        } else {
          toast.error(json.message || 'Failed to update version')
        }
      } else {
        // Create new
        const res = await apiFetch('/api/admin/app-versions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            version: formVersion.trim(),
            platform: formPlatform,
            changelog: formChangelog.trim() || undefined,
            downloadUrl: formDownloadUrl.trim() || undefined,
            isForceUpdate: formForceUpdate,
            isActive: formIsActive,
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success('Version released successfully!')
          setDialogOpen(false)
          resetForm()
          fetchVersions()
        } else {
          toast.error(json.message || 'Failed to create version')
        }
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleToggleActive = async (version: AppVersion) => {
    setToggling(version.id)
    try {
      const res = await apiFetch('/api/admin/app-versions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: version.id, isActive: !version.isActive }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(version.isActive ? 'Version deactivated' : 'Version activated')
        fetchVersions()
      } else {
        toast.error(json.message || 'Failed to toggle version')
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
      const res = await apiFetch('/api/admin/app-versions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Version deleted')
        setDeleteConfirm(null)
        fetchVersions()
      } else {
        toast.error(json.message || 'Failed to delete version')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setDeleting(null)
    }
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
            <Package className="size-6 text-amber-600" />
            App Version Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage app versions, releases, and force updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchVersions}
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
                Release Version
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>{editingVersion ? 'Edit Version' : 'Release New Version'}</DialogTitle>
                <DialogDescription>
                  {editingVersion
                    ? 'Update the version details below.'
                    : 'Define a new app version release with changelog and settings.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Version</Label>
                    <Input
                      value={formVersion}
                      onChange={(e) => setFormVersion(e.target.value)}
                      placeholder="e.g. 2.1.0"
                      className="bg-gray-50/80 border-gray-200 font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Semantic version number</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Platform</Label>
                    <Select
                      value={formPlatform}
                      onValueChange={setFormPlatform}
                      disabled={!!editingVersion}
                    >
                      <SelectTrigger className="bg-gray-50/80 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="android">Android</SelectItem>
                        <SelectItem value="ios">iOS</SelectItem>
                        <SelectItem value="web">Web</SelectItem>
                      </SelectContent>
                    </Select>
                    {editingVersion && (
                      <p className="text-xs text-muted-foreground">Platform cannot be changed</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Changelog</Label>
                  <Textarea
                    value={formChangelog}
                    onChange={(e) => setFormChangelog(e.target.value)}
                    placeholder="What's new in this version..."
                    className="bg-gray-50/80 border-gray-200 min-h-[100px] resize-y"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Download URL</Label>
                  <Input
                    value={formDownloadUrl}
                    onChange={(e) => setFormDownloadUrl(e.target.value)}
                    placeholder="https://play.google.com/store/apps/..."
                    className="bg-gray-50/80 border-gray-200 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">APK, store, or download link</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Force Update</Label>
                    <div className="flex items-center gap-3 h-10 px-3 rounded-md border border-gray-200 bg-gray-50/80">
                      <Switch checked={formForceUpdate} onCheckedChange={setFormForceUpdate} />
                      <span className="text-sm text-gray-600">{formForceUpdate ? 'Yes' : 'No'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Require users to update</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Active</Label>
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
                  onClick={handleSubmit}
                  disabled={formSubmitting}
                >
                  {formSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {editingVersion ? 'Updating...' : 'Releasing...'}
                    </span>
                  ) : (
                    editingVersion ? 'Update' : 'Release'
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
                    <p className="text-sm font-medium text-muted-foreground">Total Versions</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">All releases</p>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-amber-50">
                    <Tag className="size-6 text-amber-600" />
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
                    <p className="text-sm font-medium text-muted-foreground">Active Versions</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
                    <p className="text-xs text-muted-foreground mt-1">Currently active</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Platforms</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-bold text-emerald-600">{stats.byPlatform.android}</span>
                      <span className="text-xs text-muted-foreground">Android</span>
                      <span className="text-lg font-bold text-blue-600">{stats.byPlatform.ios}</span>
                      <span className="text-xs text-muted-foreground">iOS</span>
                      <span className="text-lg font-bold text-purple-600">{stats.byPlatform.web}</span>
                      <span className="text-xs text-muted-foreground">Web</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-gray-100">
                    <Smartphone className="size-5 text-gray-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Platform Filter */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <Label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter:</Label>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[160px] bg-white border-gray-200">
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="android">Android</SelectItem>
            <SelectItem value="ios">iOS</SelectItem>
            <SelectItem value="web">Web</SelectItem>
          </SelectContent>
        </Select>
        {platformFilter !== 'all' && (
          <Badge variant="outline" className="capitalize text-xs">
            {platformFilter}
          </Badge>
        )}
      </motion.div>

      {/* Version List */}
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
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : versions.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Package className="size-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-base font-medium text-gray-900 mb-1">No app versions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {platformFilter !== 'all'
                  ? `No versions found for ${platformFilter} platform.`
                  : 'Release your first app version to get started.'}
              </p>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                onClick={openCreateDialog}
              >
                <Plus className="size-4" />
                Release Version
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {versions.map((version) => (
              <motion.div
                key={version.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -10 }}
                layout
              >
                <Card className={`border-0 shadow-sm transition-colors ${version.isActive ? 'ring-1 ring-emerald-100' : ''}`}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Platform icon */}
                      <div className={`flex items-center justify-center size-11 rounded-lg shrink-0 ${getPlatformColor(version.platform)}`}>
                        {getPlatformIcon(version.platform)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">{version.version}</span>
                          <Badge className={`${getPlatformBadgeColor(version.platform)} border-0 text-xs capitalize`}>
                            {version.platform}
                          </Badge>
                          {version.isForceUpdate && (
                            <Badge className="bg-red-100 text-red-700 border-0 text-xs gap-1">
                              <AlertTriangle className="size-3" />
                              Force Update
                            </Badge>
                          )}
                          <Badge className={`${version.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'} border-0 text-xs gap-1`}>
                            {version.isActive ? (
                              <>
                                <CheckCircle2 className="size-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="size-3" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </div>

                        {/* Changelog */}
                        {version.changelog && (
                          <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-line">
                            {version.changelog}
                          </p>
                        )}

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <Tag className="size-3" />
                            Released {formatDate(version.releasedAt)}
                          </span>
                          {version.downloadUrl && (
                            <a
                              href={version.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-amber-600 hover:text-amber-700 hover:underline"
                            >
                              <Download className="size-3" />
                              Download
                              <ExternalLink className="size-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Toggle Active */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(version)}
                          disabled={toggling === version.id}
                          className={`gap-1.5 ${version.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                          {toggling === version.id ? (
                            <RefreshCw className="size-4 animate-spin" />
                          ) : version.isActive ? (
                            <CheckCircle2 className="size-4" />
                          ) : (
                            <XCircle className="size-4" />
                          )}
                          <span className="text-xs font-medium hidden sm:inline">
                            {toggling === version.id ? '...' : version.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </Button>

                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(version)}
                          className="text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                        >
                          <Edit className="size-4" />
                        </Button>

                        {/* Delete */}
                        {deleteConfirm === version.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs h-8"
                              onClick={() => handleDelete(version.id)}
                              disabled={deleting === version.id}
                            >
                              {deleting === version.id ? (
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
                            onClick={() => setDeleteConfirm(version.id)}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
