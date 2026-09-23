'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Users,
  ShoppingCart,
  Building2,
  RefreshCw,
  Loader2,
  FileUp,
  X,
  Clock,
  Trash2,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ────────────────────────────────────────────────────────────────────
type BulkType = 'students' | 'teachers' | 'orders' | 'organizations'

interface ExportCount {
  students: number
  teachers: number
  orders: number
  organizations: number
}

interface ImportError {
  row: number
  message: string
}

interface ImportResult {
  success: boolean
  imported: number
  total: number
  errors?: ImportError[]
  message: string
}

interface RecentOperation {
  id: string
  action: string
  category: string
  details: string | null
  userName: string | null
  createdAt: string
}

// ── Constants ────────────────────────────────────────────────────────────────
const TYPE_OPTIONS: { value: BulkType; label: string; icon: typeof GraduationCap; color: string; bgColor: string }[] = [
  { value: 'students', label: 'Students', icon: GraduationCap, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { value: 'teachers', label: 'Teachers', icon: Users, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  { value: 'orders', label: 'Orders', icon: ShoppingCart, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { value: 'organizations', label: 'Organizations', icon: Building2, color: 'text-purple-600', bgColor: 'bg-purple-50' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function timeAgo(dateStr: string): string {
  try {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 30) return `${diffDays}d ago`
    return formatDateTime(dateStr)
  } catch {
    return dateStr
  }
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminBulkOpsPage() {
  const userName = useAppStore((s) => s.userName)

  // ── State ──
  const [exportCounts, setExportCounts] = useState<ExportCount>({
    students: 0,
    teachers: 0,
    orders: 0,
    organizations: 0,
  })
  const [selectedExportType, setSelectedExportType] = useState<BulkType | null>(null)
  const [exportLoading, setExportLoading] = useState(false)
  const [countsLoading, setCountsLoading] = useState(true)

  // Import state
  const [importType, setImportType] = useState<BulkType>('students')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<any[] | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importErrors, setImportErrors] = useState<ImportError[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false)

  // Recent operations
  const [recentOps, setRecentOps] = useState<RecentOperation[]>([])
  const [opsLoading, setOpsLoading] = useState(false)

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Fetch counts ──
  const fetchCounts = useCallback(async () => {
    setCountsLoading(true)
    try {
      const [studentsRes, teachersRes, ordersRes, orgsRes] = await Promise.all([
        apiFetch('/api/admin/students?pageSize=1'),
        apiFetch('/api/admin/teachers?pageSize=1'),
        apiFetch('/api/admin/orders?page=1&limit=1'),
        apiFetch('/api/admin/organizations?pageSize=1'),
      ])

      const counts: ExportCount = { students: 0, teachers: 0, orders: 0, organizations: 0 }

      if (studentsRes.ok) {
        const data = await studentsRes.json()
        counts.students = data.pagination?.totalItems || data.stats?.total || 0
      }
      if (teachersRes.ok) {
        const data = await teachersRes.json()
        counts.teachers = data.pagination?.totalItems || data.teachers?.length || 0
      }
      if (ordersRes.ok) {
        const data = await ordersRes.json()
        counts.orders = data.total || 0
      }
      if (orgsRes.ok) {
        const data = await orgsRes.json()
        counts.organizations = data.pagination?.totalItems || data.organizations?.length || 0
      }

      setExportCounts(counts)
    } catch (err) {
      console.error('Failed to fetch counts:', err)
    } finally {
      setCountsLoading(false)
    }
  }, [])

  // ── Fetch recent bulk operations ──
  const fetchRecentOps = useCallback(async () => {
    setOpsLoading(true)
    try {
      const res = await apiFetch('/api/admin/audit-log?action=bulk&limit=20')
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.logs)) {
          setRecentOps(data.logs)
        }
      }
    } catch {
      // Silently fail — the recent ops section is supplementary
    } finally {
      setOpsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCounts()
    fetchRecentOps()
  }, [fetchCounts, fetchRecentOps])

  // ── Export handler ──
  const handleExport = async (type: BulkType) => {
    setSelectedExportType(type)
    setExportLoading(true)
    try {
      const res = await apiFetch(`/api/admin/bulk-ops?type=${type}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Export failed')
      }
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Export failed')

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_export_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Exported ${data.count} ${type} successfully!`)
      fetchRecentOps()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExportLoading(false)
      setSelectedExportType(null)
    }
  }

  // ── File parse handler ──
  const parseFile = useCallback((file: File) => {
    setParseError(null)
    setImportData(null)
    setImportResult(null)
    setImportErrors([])

    if (!file.name.endsWith('.json')) {
      setParseError('Only JSON files are supported. Please upload a .json file.')
      setImportFile(null)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setParseError('File is too large. Maximum size is 10MB.')
      setImportFile(null)
      return
    }

    setImportFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsed = JSON.parse(content)

        let records: any[] = []
        if (Array.isArray(parsed)) {
          records = parsed
        } else if (parsed.data && Array.isArray(parsed.data)) {
          // Support the export format { data: [...] }
          records = parsed.data
        } else {
          setParseError('Invalid file format. Expected a JSON array or an object with a "data" array.')
          return
        }

        if (records.length === 0) {
          setParseError('The file contains no records to import.')
          return
        }

        if (records.length > 5000) {
          setParseError(`Too many records (${records.length}). Maximum is 5000 per import.`)
          return
        }

        setImportData(records)
        toast.info(`Parsed ${records.length} records from file.`)
      } catch {
        setParseError('Failed to parse JSON. Please check the file format.')
      }
    }
    reader.onerror = () => {
      setParseError('Failed to read file.')
    }
    reader.readAsText(file)
  }, [])

  // ── Drag & drop handlers ──
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      parseFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      parseFile(files[0])
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // ── Import handler ──
  const handleImport = async () => {
    if (!importData || importData.length === 0) {
      toast.error('No data to import. Please upload a file first.')
      return
    }

    setImportLoading(true)
    setImportProgress(0)
    setImportResult(null)
    setImportErrors([])

    // Simulate progress
    const progressInterval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 300)

    try {
      const res = await apiFetch('/api/admin/bulk-ops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: importType, data: importData }),
      })

      const data: ImportResult = await res.json()

      clearInterval(progressInterval)
      setImportProgress(100)

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Import failed')
      }

      setImportResult(data)
      if (data.errors && data.errors.length > 0) {
        setImportErrors(data.errors)
      }

      if (data.imported === data.total) {
        toast.success(`All ${data.imported} ${importType} imported successfully!`)
      } else {
        toast.warning(`Imported ${data.imported} of ${data.total} ${importType}. ${data.errors?.length || 0} had errors.`)
      }

      // Refresh counts and recent ops
      fetchCounts()
      fetchRecentOps()
    } catch (err) {
      clearInterval(progressInterval)
      setImportProgress(0)
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImportLoading(false)
    }
  }

  // ── Clear import state ──
  const handleClearImport = () => {
    setImportFile(null)
    setImportData(null)
    setImportResult(null)
    setImportErrors([])
    setParseError(null)
    setImportProgress(0)
  }

  // ── Get preview columns for import type ──
  const getPreviewColumns = (): string[] => {
    if (!importData || importData.length === 0) return []
    const firstRecord = importData[0]
    return Object.keys(firstRecord).slice(0, 6) // Show max 6 columns in preview
  }

  // ── Format action for display ──
  const formatAction = (action: string): { label: string; type: 'export' | 'import' } => {
    if (action.startsWith('bulk.export')) {
      return { label: `Export ${action.replace('bulk.export.', '')}`, type: 'export' }
    }
    if (action.startsWith('bulk.import')) {
      return { label: `Import ${action.replace('bulk.import.', '')}`, type: 'import' }
    }
    return { label: action, type: 'export' }
  }

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-amber-100">
            <FileSpreadsheet className="size-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import / Export</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Bulk manage platform data
            </p>
          </div>
        </div>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT: Export Section ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Download className="size-4 text-amber-600" />
                <CardTitle className="text-base">Export Data</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Download platform data as JSON for backup or migration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {TYPE_OPTIONS.map((opt) => {
                const count = exportCounts[opt.value]
                const isSelected = selectedExportType === opt.value
                const isLoading = exportLoading && isSelected

                return (
                  <motion.div
                    key={opt.value}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <button
                      onClick={() => !exportLoading && handleExport(opt.value)}
                      disabled={exportLoading}
                      className="w-full text-left rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 p-4 transition-all duration-200 group disabled:opacity-60"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center size-10 rounded-lg ${opt.bgColor}`}>
                            <opt.icon className={`size-5 ${opt.color}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 group-hover:text-amber-700 transition-colors">
                              {opt.label}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              {countsLoading ? (
                                <Skeleton className="h-3 w-16 inline-block" />
                              ) : (
                                `${count.toLocaleString()} records`
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isLoading ? (
                            <Loader2 className="size-4 text-amber-600 animate-spin" />
                          ) : (
                            <Download className="size-4 text-gray-400 group-hover:text-amber-600 transition-colors" />
                          )}
                        </div>
                      </div>
                    </button>
                  </motion.div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── RIGHT: Import Section ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Upload className="size-4 text-amber-600" />
                <CardTitle className="text-base">Import Data</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Upload a JSON file to bulk import records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Data Type</Label>
                <Select
                  value={importType}
                  onValueChange={(val) => {
                    setImportType(val as BulkType)
                    handleClearImport()
                  }}
                  disabled={importLoading}
                >
                  <SelectTrigger className="bg-gray-50/80 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className={`size-4 ${opt.color}`} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Drag & Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !importLoading && fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                  ${isDragging
                    ? 'border-amber-400 bg-amber-50/50'
                    : importFile
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/20'
                  }
                  ${importLoading ? 'pointer-events-none opacity-60' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <AnimatePresence mode="wait">
                  {importFile ? (
                    <motion.div
                      key="file-loaded"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-center size-12 rounded-full bg-emerald-100 mx-auto">
                        <CheckCircle className="size-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{importFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(importFile.size / 1024).toFixed(1)} KB
                          {importData && ` — ${importData.length} records`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClearImport()
                        }}
                        disabled={importLoading}
                      >
                        <Trash2 className="size-3 mr-1" />
                        Remove file
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="file-empty"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-center size-12 rounded-full bg-gray-100 mx-auto">
                        {isDragging ? (
                          <FileUp className="size-6 text-amber-600" />
                        ) : (
                          <Upload className="size-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {isDragging ? 'Drop your file here' : 'Drag & drop a JSON file'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          or click to browse — max 10MB, up to 5,000 records
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Parse error */}
              {parseError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 p-3"
                >
                  <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{parseError}</p>
                </motion.div>
              )}

              {/* Preview table */}
              {importData && importData.length > 0 && !importLoading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      Preview ({importData.length} records)
                    </p>
                    <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-0">
                      {importType}
                    </Badge>
                  </div>
                  <div className="rounded-lg border border-gray-100 overflow-hidden">
                    <ScrollArea className="max-h-48">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-gray-100 hover:bg-transparent">
                            {getPreviewColumns().map((col) => (
                              <TableHead key={col} className="text-xs font-medium text-muted-foreground px-3 py-2">
                                {col}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importData.slice(0, 5).map((record, idx) => (
                            <TableRow key={idx} className="border-b border-gray-50 hover:bg-transparent">
                              {getPreviewColumns().map((col) => (
                                <TableCell key={col} className="text-xs px-3 py-1.5 text-gray-700 max-w-[140px] truncate">
                                  {record[col] !== null && record[col] !== undefined
                                    ? String(record[col]).slice(0, 40)
                                    : '—'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                    {importData.length > 5 && (
                      <div className="px-3 py-1.5 border-t border-gray-50 bg-gray-50/50">
                        <p className="text-xs text-muted-foreground text-center">
                          Showing 5 of {importData.length} records
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Progress bar */}
              {importLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Importing {importType}...</span>
                    <span>{Math.round(importProgress)}%</span>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                </motion.div>
              )}

              {/* Import result */}
              {importResult && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className={`
                    rounded-lg border p-3
                    ${importResult.imported === importResult.total
                      ? 'bg-emerald-50 border-emerald-100'
                      : 'bg-amber-50 border-amber-100'
                    }
                  `}>
                    <div className="flex items-start gap-2">
                      {importResult.imported === importResult.total ? (
                        <CheckCircle className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={`text-xs font-medium ${
                          importResult.imported === importResult.total ? 'text-emerald-800' : 'text-amber-800'
                        }`}>
                          {importResult.message}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-xs">
                            {importResult.imported} imported
                          </Badge>
                          {importResult.total - importResult.imported > 0 && (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0 text-xs">
                              {importResult.total - importResult.imported} failed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Errors list */}
                  {importErrors.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-red-700 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        Validation Errors ({importErrors.length})
                      </p>
                      <ScrollArea className="max-h-32">
                        <div className="space-y-1">
                          {importErrors.map((err, idx) => (
                            <div key={idx} className="text-xs text-red-600 bg-red-50/50 rounded px-2 py-1 flex items-start gap-1.5">
                              <span className="font-medium shrink-0">Row {err.row}:</span>
                              <span>{err.message}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Import button */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={!importData || importData.length === 0 || importLoading}
                  onClick={() => setConfirmDialogOpen(true)}
                >
                  {importLoading ? (
                    <>
                      <Loader2 className="size-4 mr-1.5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="size-4 mr-1.5" />
                      Import {importData ? `(${importData.length} records)` : ''}
                    </>
                  )}
                </Button>
                {(importFile || importData) && !importLoading && (
                  <Button variant="outline" size="icon" onClick={handleClearImport} className="shrink-0">
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Recent Operations ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-amber-600" />
                <CardTitle className="text-base">Recent Operations</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchRecentOps}
                className="text-muted-foreground"
                disabled={opsLoading}
              >
                <RefreshCw className={`size-3.5 mr-1 ${opsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <CardDescription className="text-xs">
              Recent bulk import and export operations
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {opsLoading ? (
              <div className="space-y-0">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-3 border-b border-gray-50">
                    <Skeleton className="size-8 rounded-lg" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24 ml-auto" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : recentOps.length === 0 ? (
              <div className="py-12 text-center">
                <FileSpreadsheet className="size-10 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No bulk operations yet</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  Import or export data to see operations here
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-100 hover:bg-transparent">
                        <TableHead className="text-xs font-medium text-muted-foreground">Operation</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Type</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Details</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Performed By</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOps.slice(0, 10).map((op) => {
                        const formatted = formatAction(op.action)
                        let detailsObj: Record<string, unknown> | null = null
                        try {
                          detailsObj = op.details ? JSON.parse(op.details) : null
                        } catch { /* ignore */ }

                        return (
                          <TableRow key={op.id} className="border-b border-gray-50 hover:bg-amber-50/20 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`flex items-center justify-center size-7 rounded-lg ${
                                  formatted.type === 'export'
                                    ? 'bg-emerald-50'
                                    : 'bg-amber-50'
                                }`}>
                                  {formatted.type === 'export' ? (
                                    <Download className="size-3.5 text-emerald-600" />
                                  ) : (
                                    <Upload className="size-3.5 text-amber-600" />
                                  )}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{formatted.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`border-0 text-xs ${
                                formatted.type === 'export'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {formatted.type === 'export' ? 'Export' : 'Import'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {detailsObj ? (
                                <div className="flex items-center gap-1.5">
                                  {detailsObj.recordCount !== undefined && (
                                    <span className="text-xs text-muted-foreground">
                                      {String(detailsObj.recordCount)} records
                                    </span>
                                  )}
                                  {detailsObj.imported !== undefined && (
                                    <span className="text-xs text-muted-foreground">
                                      {String(detailsObj.imported)}/{String(detailsObj.totalRecords || detailsObj.total || '?')} imported
                                    </span>
                                  )}
                                  {detailsObj.errorsCount !== undefined && Number(detailsObj.errorsCount) > 0 && (
                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0 text-[9px] ml-1">
                                      {String(detailsObj.errorsCount)} errors
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {op.userName || 'System'}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              <span title={formatDateTime(op.createdAt)}>
                                {timeAgo(op.createdAt)}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-2 px-4 pb-4">
                  {recentOps.slice(0, 6).map((op) => {
                    const formatted = formatAction(op.action)
                    return (
                      <div
                        key={op.id}
                        className="border border-gray-100 rounded-lg p-3 flex items-start justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex items-center justify-center size-8 rounded-lg shrink-0 ${
                            formatted.type === 'export' ? 'bg-emerald-50' : 'bg-amber-50'
                          }`}>
                            {formatted.type === 'export' ? (
                              <Download className="size-4 text-emerald-600" />
                            ) : (
                              <Upload className="size-4 text-amber-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{formatted.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {op.userName || 'System'} · {timeAgo(op.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Badge className={`border-0 text-xs shrink-0 ${
                          formatted.type === 'export'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {formatted.type === 'export' ? 'Export' : 'Import'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Confirmation Dialog ──────────────────────────────────────────── */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-amber-600" />
              Confirm Import
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to import <strong>{importData?.length || 0}</strong> {importType} records into the platform.
              </p>
              <p className="text-amber-700 bg-amber-50 rounded-md p-2 text-xs">
                This action will create new records in the database. Please ensure your data is correct
                and that you have reviewed the preview above.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={importLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDialogOpen(false)
                handleImport()
              }}
              disabled={importLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {importLoading ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="size-4 mr-1.5" />
                  Confirm Import
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
