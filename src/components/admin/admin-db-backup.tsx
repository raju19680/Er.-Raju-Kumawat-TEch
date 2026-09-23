'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Database,
  HardDrive,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileArchive,
  Info,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'

// ── Types ────────────────────────────────────────────────────────────────────

interface BackupRecord {
  id: string
  filename: string
  size: number
  sizeFormatted: string
  status: string
  triggeredBy: string | null
  triggeredByName: string | null
  notes: string | null
  createdAt: string
}

interface BackupStats {
  total: number
  completed: number
  failed: number
  totalSize: number
  totalSizeFormatted: string
}

interface DbInfo {
  path: string
  size: number
  sizeFormatted: string
}

interface BackupData {
  success: boolean
  backups: BackupRecord[]
  stats: BackupStats
  dbInfo: DbInfo
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

// ── Skeleton Loaders ─────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DbInfoSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BackupListSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AdminDbBackupPage() {
  const { adminPage } = useAppStore()

  const [data, setData] = useState<BackupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create backup dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [backupNotes, setBackupNotes] = useState('')

  // Delete backup state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchBackups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/admin/db-backup')
      const json = await res.json()
      if (json.success) {
        setData(json)
      } else {
        setError(json.message || 'Failed to load backup data')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBackups()
  }, [fetchBackups])

  // ── Create backup handler ──
  const handleCreateBackup = async () => {
    setCreatingBackup(true)
    try {
      const res = await apiFetch('/api/admin/db-backup', {
        method: 'POST',
        body: JSON.stringify({ notes: backupNotes || null }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Backup created successfully', {
          description: `${json.backup.filename} (${json.backup.sizeFormatted})`,
        })
        setCreateDialogOpen(false)
        setBackupNotes('')
        fetchBackups()
      } else {
        toast.error('Failed to create backup', {
          description: json.message || 'Unknown error',
        })
      }
    } catch {
      toast.error('Network error', {
        description: 'Please check your connection and try again.',
      })
    } finally {
      setCreatingBackup(false)
    }
  }

  // ── Delete backup handler ──
  const handleDeleteBackup = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await apiFetch('/api/admin/db-backup', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Backup deleted successfully')
        fetchBackups()
      } else {
        toast.error('Failed to delete backup', {
          description: json.message || 'Unknown error',
        })
      }
    } catch {
      toast.error('Network error', {
        description: 'Please check your connection and try again.',
      })
    } finally {
      setDeletingId(null)
    }
  }

  // ── Only render for the correct page ──
  if (adminPage !== 'admin-db-backup') return null

  const stats = data?.stats
  const dbInfo = data?.dbInfo
  const backups = data?.backups || []

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Page Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="size-6 text-amber-600" />
            Database Backup
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and create database backups
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBackups}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="size-4" />
                Create Backup
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Database className="size-5 text-amber-600" />
                  Create Database Backup
                </DialogTitle>
                <DialogDescription>
                  Create a snapshot of the current database. The backup will be stored on the server.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notes (optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Add a note for this backup, e.g., 'Before major schema change'"
                    value={backupNotes}
                    onChange={(e) => setBackupNotes(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>
                {dbInfo && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                    <Info className="size-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-amber-800">
                      <p className="font-medium">Current database size: {dbInfo.sizeFormatted}</p>
                      <p className="mt-0.5 text-amber-700">The backup will copy the entire SQLite database file.</p>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={creatingBackup}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateBackup}
                  disabled={creatingBackup}
                  className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {creatingBackup ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Download className="size-4" />
                      Create Backup
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* ── Error State ── */}
      {error && !loading && (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="size-5 text-red-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchBackups}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Warning Banner ── */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-400 bg-amber-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Important Notice</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Backups are stored on the server. For critical data, download backups to a secure location. Server backups may be lost if the server is reset.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Database Info Card ── */}
      {loading && !data ? (
        <DbInfoSkeleton />
      ) : dbInfo ? (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center size-12 rounded-xl bg-amber-50 shrink-0">
                  <HardDrive className="size-6 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">Current Database</p>
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                      <CheckCircle2 className="size-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1.5">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileArchive className="size-3" />
                      {dbInfo.path}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <HardDrive className="size-3" />
                      {dbInfo.sizeFormatted}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      {/* ── Stats Row ── */}
      {loading && !data ? (
        <StatsSkeleton />
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Backups */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Backups</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.failed > 0 ? `${stats.failed} failed` : 'All backups available'}
                    </p>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-amber-50">
                    <Database className="size-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Completed */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
                    <p className="text-xs text-emerald-600 mt-1">
                      {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% success rate
                    </p>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-emerald-50">
                    <CheckCircle2 className="size-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Size */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Size</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalSizeFormatted}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Across {stats.completed} backup{stats.completed !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center justify-center size-12 rounded-xl bg-sky-50">
                    <HardDrive className="size-6 text-sky-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : null}

      {/* ── Backup List ── */}
      {loading && !data ? (
        <BackupListSkeleton />
      ) : (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileArchive className="size-4 text-amber-600" />
                    Backup History
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {backups.length === 0
                      ? 'No backups yet'
                      : `${backups.length} backup${backups.length !== 1 ? 's' : ''} available`}
                  </CardDescription>
                </div>
                {backups.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {backups.length} record{backups.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {backups.length === 0 ? (
                /* Empty State */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="flex items-center justify-center size-16 rounded-2xl bg-gray-50 mx-auto mb-4">
                    <Database className="size-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">No backups yet</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Create your first database backup to get started
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setCreateDialogOpen(true)}
                    className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Plus className="size-4" />
                    Create First Backup
                  </Button>
                </motion.div>
              ) : (
                <div className="max-h-96 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full space-y-3">
                  {backups.map((backup, idx) => (
                    <motion.div
                      key={backup.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.2 }}
                      className="rounded-lg border border-gray-100 p-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Status Icon */}
                          <div className={`flex items-center justify-center size-9 rounded-lg shrink-0 mt-0.5 ${
                            backup.status === 'completed'
                              ? 'bg-emerald-50'
                              : 'bg-red-50'
                          }`}>
                            {backup.status === 'completed' ? (
                              <CheckCircle2 className="size-4 text-emerald-600" />
                            ) : (
                              <XCircle className="size-4 text-red-600" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {backup.filename}
                              </p>
                              <Badge
                                variant="outline"
                                className={`text-xs px-2 py-0.5 ${
                                  backup.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50'
                                }`}
                              >
                                {backup.status === 'completed' ? 'Completed' : 'Failed'}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <HardDrive className="size-3" />
                                {backup.sizeFormatted}
                              </span>
                              {backup.triggeredByName && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Shield className="size-3" />
                                  {backup.triggeredByName}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="size-3" />
                                <span title={formatFullDate(backup.createdAt)}>
                                  {formatRelativeTime(backup.createdAt)}
                                </span>
                              </span>
                            </div>

                            {backup.notes && (
                              <p className="text-xs text-gray-500 mt-1.5 truncate" title={backup.notes}>
                                {backup.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="shrink-0">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                disabled={deletingId === backup.id}
                              >
                                {deletingId === backup.id ? (
                                  <RefreshCw className="size-4 animate-spin" />
                                ) : (
                                  <Trash2 className="size-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="size-5 text-red-500" />
                                  Delete Backup
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the backup file <strong>{backup.filename}</strong> from the server and remove the record. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteBackup(backup.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Delete Backup
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Additional Info ── */}
      {!loading && data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Info className="size-4 text-amber-600" />
                Backup Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Storage Location</p>
                  <p className="text-sm text-gray-900 font-mono">./backups/</p>
                  <p className="text-xs text-muted-foreground">
                    All backup files are stored in the backups directory on the server
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">File Format</p>
                  <p className="text-sm text-gray-900 font-mono">backup_YYYY-MM-DD_HH-mm-ss.db</p>
                  <p className="text-xs text-muted-foreground">
                    SQLite database files with timestamp-based naming
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
