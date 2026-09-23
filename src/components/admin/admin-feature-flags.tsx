'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
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
  Flag,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ────────────────────────────────────────────────────────────────────
interface FeatureFlag {
  id: string
  key: string
  name: string
  description: string | null
  enabled: boolean
  rolloutPct: number
  targetRole: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

interface Stats {
  enabled: number
  disabled: number
  total: number
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
export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [stats, setStats] = useState<Stats>({ enabled: 0, disabled: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  // Form state
  const [formKey, setFormKey] = useState('')
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formEnabled, setFormEnabled] = useState(false)
  const [formRolloutPct, setFormRolloutPct] = useState(100)
  const [formTargetRole, setFormTargetRole] = useState('all')
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Local rollout state for slider changes (to avoid too many API calls)
  const [localRollout, setLocalRollout] = useState<Record<string, number>>({})

  const fetchFlags = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/admin/feature-flags')
      const json = await res.json()
      if (json.success) {
        setFlags(json.flags)
        setStats(json.stats)
        // Initialize local rollout state
        const rolloutMap: Record<string, number> = {}
        json.flags.forEach((f: FeatureFlag) => {
          rolloutMap[f.id] = f.rolloutPct
        })
        setLocalRollout(rolloutMap)
      }
    } catch {
      toast.error('Failed to load feature flags')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFlags()
  }, [fetchFlags])

  const resetForm = () => {
    setFormKey('')
    setFormName('')
    setFormDescription('')
    setFormEnabled(false)
    setFormRolloutPct(100)
    setFormTargetRole('all')
  }

  const handleCreate = async () => {
    if (!formKey.trim() || !formName.trim()) {
      toast.error('Key and name are required.')
      return
    }
    setFormSubmitting(true)
    try {
      const res = await apiFetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: formKey.trim(),
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          enabled: formEnabled,
          rolloutPct: formRolloutPct,
          targetRole: formTargetRole,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Feature flag created!')
        setCreateOpen(false)
        resetForm()
        fetchFlags()
      } else {
        toast.error(json.message || 'Failed to create feature flag')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    setToggling(id)
    try {
      const res = await apiFetch('/api/admin/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !currentEnabled }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(currentEnabled ? 'Feature disabled' : 'Feature enabled')
        fetchFlags()
      } else {
        toast.error(json.message || 'Failed to toggle')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setToggling(null)
    }
  }

  const handleRolloutChange = async (id: string, value: number) => {
    setLocalRollout((prev) => ({ ...prev, [id]: value }))
  }

  const handleRolloutCommit = async (id: string, value: number) => {
    try {
      const res = await apiFetch('/api/admin/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, rolloutPct: value }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Rollout updated to ${value}%`)
        fetchFlags()
      } else {
        toast.error(json.message || 'Failed to update rollout')
      }
    } catch {
      toast.error('Something went wrong.')
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await apiFetch('/api/admin/feature-flags', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Feature flag deleted')
        setDeleteConfirm(null)
        fetchFlags()
      } else {
        toast.error(json.message || 'Failed to delete')
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
            <Flag className="size-6 text-amber-600" />
            Feature Flags
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control platform features and rollouts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFlags}
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
                Create Flag
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
                <DialogDescription>
                  Define a new feature flag to control platform functionality.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Key</Label>
                  <Input
                    value={formKey}
                    onChange={(e) => setFormKey(e.target.value.replace(/\s/g, '_').toLowerCase())}
                    placeholder="e.g. new_dashboard"
                    className="bg-gray-50/80 border-gray-200 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Unique identifier (auto-lowered, spaces → underscores)</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Name</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. New Dashboard"
                    className="bg-gray-50/80 border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <Input
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="What this flag controls"
                    className="bg-gray-50/80 border-gray-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Initial State</Label>
                    <div className="flex items-center gap-3 h-10 px-3 rounded-md border border-gray-200 bg-gray-50/80">
                      <Switch checked={formEnabled} onCheckedChange={setFormEnabled} />
                      <span className="text-sm text-gray-600">{formEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Rollout Percentage: {formRolloutPct}%</Label>
                  <Slider
                    value={[formRolloutPct]}
                    onValueChange={([v]) => setFormRolloutPct(v)}
                    max={100}
                    step={5}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
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
                    <p className="text-sm font-medium text-muted-foreground">Enabled</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.enabled}</p>
                    <p className="text-xs text-muted-foreground mt-1">Active features</p>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-emerald-50">
                    <ToggleRight className="size-6 text-emerald-600" />
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
                    <p className="text-sm font-medium text-muted-foreground">Disabled</p>
                    <p className="text-2xl font-bold text-gray-500 mt-1">{stats.disabled}</p>
                    <p className="text-xs text-muted-foreground mt-1">Inactive features</p>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-gray-100">
                    <ToggleLeft className="size-6 text-gray-400" />
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
                    <p className="text-sm font-medium text-muted-foreground">Total Features</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">All feature flags</p>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-amber-50">
                    <Flag className="size-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Flags List */}
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
      ) : flags.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center">
              <Flag className="size-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-base font-medium text-gray-900 mb-1">No feature flags</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first feature flag to control platform features.
              </p>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="size-4" />
                Create Flag
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {flags.map((flag) => {
              const rollout = localRollout[flag.id] ?? flag.rolloutPct
              return (
                <motion.div
                  key={flag.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -10 }}
                  layout
                >
                  <Card className={`border-0 shadow-sm transition-colors ${flag.enabled ? 'ring-1 ring-emerald-100' : ''}`}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Flag icon */}
                        <div className={`flex items-center justify-center size-11 rounded-lg shrink-0 ${flag.enabled ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                          <Flag className={`size-5 ${flag.enabled ? 'text-emerald-600' : 'text-gray-400'}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">{flag.name}</h3>
                            <code className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                              {flag.key}
                            </code>
                            <Badge className={`${flag.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'} border-0 text-xs`}>
                              {flag.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {flag.targetRole === 'all' ? 'All Users' : flag.targetRole + 's'}
                            </Badge>
                          </div>
                          {flag.description && (
                            <p className="text-sm text-muted-foreground">{flag.description}</p>
                          )}

                          {/* Rollout slider */}
                          <div className="pt-1">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-16 shrink-0">Rollout:</span>
                              <div className="flex-1 max-w-[200px]">
                                <Slider
                                  value={[rollout]}
                                  onValueChange={([v]) => handleRolloutChange(flag.id, v)}
                                  onValueCommit={([v]) => handleRolloutCommit(flag.id, v)}
                                  max={100}
                                  step={5}
                                  disabled={!flag.enabled}
                                  className={`py-1 ${!flag.enabled ? 'opacity-40' : ''}`}
                                />
                              </div>
                              <span className={`text-xs font-medium tabular-nums w-8 ${flag.enabled ? 'text-gray-700' : 'text-gray-400'}`}>
                                {rollout}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50">
                            <Switch
                              checked={flag.enabled}
                              onCheckedChange={() => handleToggle(flag.id, flag.enabled)}
                              disabled={toggling === flag.id}
                            />
                            <span className={`text-xs font-medium ${flag.enabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {toggling === flag.id ? (
                                <RefreshCw className="size-3 animate-spin" />
                              ) : flag.enabled ? (
                                'ON'
                              ) : (
                                'OFF'
                              )}
                            </span>
                          </div>

                          {/* Delete */}
                          {deleteConfirm === flag.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs h-8"
                                onClick={() => handleDelete(flag.id)}
                                disabled={deleting === flag.id}
                              >
                                {deleting === flag.id ? (
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
                              onClick={() => setDeleteConfirm(flag.id)}
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
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
