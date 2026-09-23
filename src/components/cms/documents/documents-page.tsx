'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  FileText,
  Plus,
  Trash2,
  Search,
  Download,
  File,
  FileSpreadsheet,
  Image,
  Upload,
  Loader2,
  Folder,
  Pencil,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  HardDrive,
  FileImage,
  Presentation,
  Paperclip,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { NotesStudio } from './notes-studio'
import { PenTool, Sparkles } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────

type FileType = 'pdf' | 'doc' | 'xls' | 'ppt' | 'image' | 'other'
type DocStatus = 'active' | 'archived' | 'draft'
type DocCategory = 'Syllabus' | 'Notes' | 'Schedule' | 'Question Paper' | 'Study Material' | 'Other'

interface Document {
  id: string
  title: string
  description: string
  fileType: FileType
  category: DocCategory
  fileSize: string
  downloadCount: number
  isPublic: boolean
  status: DocStatus
  tags: string[]
  fileUrl: string
  createdAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const FILE_TYPE_CONFIG: Record<FileType, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  pdf: { label: 'PDF', icon: FileText, color: 'text-red-600', bgColor: 'bg-red-50' },
  doc: { label: 'DOC', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  xls: { label: 'XLS', icon: FileSpreadsheet, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  ppt: { label: 'PPT', icon: Presentation, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  image: { label: 'Image', icon: FileImage, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  other: { label: 'Other', icon: File, color: 'text-gray-600', bgColor: 'bg-gray-100' },
}

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-emerald-50 text-emerald-700' },
  archived: { label: 'Archived', color: 'bg-amber-50 text-amber-700' },
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
}

const CATEGORY_COLORS: Record<DocCategory, string> = {
  Syllabus: 'bg-violet-50 text-violet-700',
  Notes: 'bg-sky-50 text-sky-700',
  Schedule: 'bg-amber-50 text-amber-700',
  'Question Paper': 'bg-red-50 text-red-700',
  'Study Material': 'bg-emerald-50 text-emerald-700',
  Other: 'bg-gray-50 text-gray-600',
}

const FILE_TYPES: FileType[] = ['pdf', 'doc', 'xls', 'ppt', 'image', 'other']
const CATEGORIES: DocCategory[] = ['Syllabus', 'Notes', 'Schedule', 'Question Paper', 'Study Material', 'Other']
const STATUSES: DocStatus[] = ['active', 'archived', 'draft']

function formatFileSize(sizeKB: number): string {
  if (!sizeKB) return '0 KB'
  if (sizeKB >= 1024 * 1024) return `${(sizeKB / (1024 * 1024)).toFixed(1)} GB`
  if (sizeKB >= 1024) return `${(sizeKB / 1024).toFixed(1)} MB`
  return `${Math.round(sizeKB)} KB`
}

function parseTags(tagsField: unknown): string[] {
  if (Array.isArray(tagsField)) return tagsField as string[]
  if (typeof tagsField === 'string') {
    try {
      const parsed = JSON.parse(tagsField)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return tagsField ? [tagsField] : []
    }
  }
  return []
}

function mapApiDocument(apiItem: Record<string, unknown>): Document {
  const fileSizeKB = (apiItem.fileSize as number) || 0
  return {
    id: apiItem.id as string,
    title: (apiItem.title as string) || '',
    description: (apiItem.description as string) || '',
    fileType: (apiItem.fileType as FileType) || 'pdf',
    category: (apiItem.category as DocCategory) || 'Other',
    fileSize: formatFileSize(fileSizeKB),
    downloadCount: (apiItem.downloadCount as number) || 0,
    isPublic: (apiItem.isPublic as boolean) || false,
    status: (apiItem.status as DocStatus) || 'active',
    tags: parseTags(apiItem.tags),
    fileUrl: (apiItem.fileUrl as string) || '',
    createdAt: apiItem.createdAt
      ? new Date(apiItem.createdAt as string).toISOString().split('T')[0]
      : '',
  }
}

// ─── Component ────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const { userName, orgCode } = useAppStore()
  const [documents, setDocuments] = useState<Document[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreate, setShowCreate] = useState(false)
  const [editDoc, setEditDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formFileType, setFormFileType] = useState<FileType>('pdf')
  const [formCategory, setFormCategory] = useState<DocCategory>('Study Material')
  const [formTags, setFormTags] = useState('')
  const [formPublic, setFormPublic] = useState(true)
  const [formStatus, setFormStatus] = useState<DocStatus>('active')
  const [saving, setSaving] = useState(false)

  // Studio Mode State
  const [isStudioOpen, setIsStudioOpen] = useState(false)
  const [activeStudioDoc, setActiveStudioDoc] = useState<any>(null)

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiFetch(`/api/teacher/documents?organizationId=${orgCode}&limit=100`)
      const data = await response.json()
      if (data.items) {
        setDocuments(data.items.map((item: Record<string, unknown>) => mapApiDocument(item)))
      }
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [orgCode])

  useEffect(() => {
    if (orgCode) {
      fetchDocuments()
    }
  }, [orgCode, fetchDocuments])

  // Filtered
  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === 'all' || d.fileType === typeFilter
      const matchCategory = categoryFilter === 'all' || d.category === categoryFilter
      const matchStatus = statusFilter === 'all' || d.status === statusFilter
      return matchSearch && matchType && matchCategory && matchStatus
    })
  }, [documents, search, typeFilter, categoryFilter, statusFilter])

  // Stats
  const totalDocuments = documents.length
  const publicDocs = documents.filter((d) => d.isPublic).length
  const totalDownloads = documents.reduce((a, d) => a + d.downloadCount, 0)
  const storageUsed = documents.reduce((a, d) => {
    const match = d.fileSize.match(/([\d.]+)\s*(MB|KB|GB)/)
    if (match) {
      const val = parseFloat(match[1])
      const unit = match[2]
      if (unit === 'GB') return a + val * 1024
      if (unit === 'MB') return a + val
      if (unit === 'KB') return a + val / 1024
    }
    return a
  }, 0)

  function resetForm() {
    setFormTitle('')
    setFormDesc('')
    setFormFileType('pdf')
    setFormCategory('Study Material')
    setFormTags('')
    setFormPublic(true)
    setFormStatus('active')
  }

  function openCreate() {
    resetForm()
    setEditDoc(null)
    setShowCreate(true)
  }

  function openEdit(d: Document) {
    if (d.fileType === 'doc' || !d.fileUrl) {
      setActiveStudioDoc(d)
      setIsStudioOpen(true)
      return
    }
    setFormTitle(d.title)
    setFormDesc(d.description)
    setFormFileType(d.fileType)
    setFormCategory(d.category)
    setFormTags(d.tags.join(', '))
    setFormPublic(d.isPublic)
    setFormStatus(d.status)
    setEditDoc(d)
    setShowCreate(true)
  }

  async function handleSave() {
    if (!formTitle.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const tags = formTags.split(',').map((t) => t.trim()).filter(Boolean)
      if (editDoc) {
        const response = await apiFetch(`/api/teacher/documents/${editDoc.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: formTitle,
            description: formDesc,
            fileType: formFileType,
            category: formCategory,
            tags: JSON.stringify(tags),
            isPublic: formPublic,
            status: formStatus,
            organizationId: orgCode,
          }),
        })
        const data = await response.json()
        if (data.success) {
          await fetchDocuments()
          toast.success('Document updated')
        } else {
          toast.error(data.error || 'Failed to update document')
        }
      } else {
        const response = await apiFetch('/api/teacher/documents', {
          method: 'POST',
          body: JSON.stringify({
            title: formTitle,
            description: formDesc,
            fileType: formFileType,
            category: formCategory,
            tags: JSON.stringify(tags),
            isPublic: formPublic,
            status: formStatus,
            organizationId: orgCode,
          }),
        })
        const data = await response.json()
        if (data.success) {
          await fetchDocuments()
          toast.success('Document uploaded')
        } else {
          toast.error(data.error || 'Failed to upload document')
        }
      }
      setShowCreate(false)
    } catch {
      toast.error('Failed to save document')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await apiFetch(`/api/teacher/documents/${id}?organizationId=${orgCode}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== id))
        toast.success('Document deleted')
      } else {
        toast.error(data.error || 'Failed to delete document')
      }
    } catch {
      toast.error('Failed to delete document')
    }
  }

  async function handleTogglePublic(doc: Document) {
    try {
      const response = await apiFetch(`/api/teacher/documents/${doc.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublic: !doc.isPublic, organizationId: orgCode }),
      })
      const data = await response.json()
      if (data.success) {
        setDocuments((prev) =>
          prev.map((d) => d.id === doc.id ? { ...d, isPublic: !d.isPublic } : d)
        )
        toast.success(doc.isPublic ? 'Document set to private' : 'Document set to public')
      } else {
        toast.error(data.error || 'Failed to toggle visibility')
      }
    } catch {
      toast.error('Failed to toggle visibility')
    }
  }

  async function handleDownload(d: Document) {
    try {
      // Increment download count via API
      const response = await apiFetch('/api/teacher/documents', {
        method: 'POST',
        body: JSON.stringify({ incrementDownloads: true, id: d.id, organizationId: orgCode }),
      })
      const data = await response.json()
      if (data.success || data.item) {
        // Update local state
        setDocuments((prev) =>
          prev.map((doc) => doc.id === d.id ? { ...doc, downloadCount: doc.downloadCount + 1 } : doc)
        )
      }
      // Open file URL if available
      if (d.fileUrl) {
        window.open(d.fileUrl, '_blank')
      }
      toast.success(`Downloading "${d.title}"...`)
    } catch {
      toast.error('Failed to download document')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground text-sm">Manage and organize your document library</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (isStudioOpen) {
    return (
      <div className="p-4 md:p-6">
        <NotesStudio
          initialDocument={activeStudioDoc}
          onBack={() => setIsStudioOpen(false)}
          onSaved={() => {
            setIsStudioOpen(false)
            fetchDocuments()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Documents & Notes Studio</h1>
            <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs">ADVANCED</Badge>
          </div>
          <p className="text-muted-foreground text-sm">Create interactive rich notes, LaTeX formulas, checklists, and manage PDF study materials</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setActiveStudioDoc(null)
              setIsStudioOpen(true)
            }}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm"
          >
            <PenTool className="h-4 w-4" />
            Create Notes & Formulas (Studio)
          </Button>
          <Button variant="outline" onClick={openCreate} className="gap-2 w-fit">
            <Upload className="h-4 w-4" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: totalDocuments, icon: FileText, color: 'text-violet-600' },
          { label: 'Public', value: publicDocs, icon: Eye, color: 'text-emerald-600' },
          { label: 'Total Downloads', value: totalDownloads.toLocaleString(), icon: Download, color: 'text-sky-600' },
          { label: 'Storage Used', value: `${storageUsed.toFixed(1)} MB`, icon: HardDrive, color: 'text-amber-600' },
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
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {FILE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{FILE_TYPE_CONFIG[t].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1 border rounded-md p-0.5">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Folder className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">No documents found</p>
          <p className="text-sm">Upload a document to get started</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((d) => {
            const fc = FILE_TYPE_CONFIG[d.fileType]
            const FileIcon = fc.icon
            const statusColor = STATUS_CONFIG[d.status]?.color
            const catColor = CATEGORY_COLORS[d.category] || 'bg-gray-50 text-gray-600'
            return (
              <Card key={d.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  {/* File icon + Title + Visibility */}
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-lg ${fc.bgColor} ${fc.color} flex items-center justify-center shrink-0`}>
                      <FileIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{d.title}</h3>
                        <div className="flex items-center gap-1 shrink-0">
                          {d.isPublic ? (
                            <Eye className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`${fc.bgColor} ${fc.color} text-xs h-4 px-1.5 border-0`}>
                          {fc.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{d.fileSize}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2">{d.description}</p>

                  {/* Category + Status + Public/Private */}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={`${catColor} text-xs h-5`}>{d.category}</Badge>
                    <Badge variant="secondary" className={`${STATUS_CONFIG[d.status]?.color || ''} text-xs h-5`}>
                      {STATUS_CONFIG[d.status]?.label || d.status}
                    </Badge>
                    <Badge variant="outline" className={`text-xs h-5 ${d.isPublic ? 'text-emerald-600 border-emerald-200' : 'text-gray-500'}`}>
                      {d.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>

                  {/* Tags */}
                  {d.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {d.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Downloads + Date */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {d.downloadCount.toLocaleString()} downloads
                    </span>
                    <span>{d.createdAt}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleDownload(d)}>
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEdit(d)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive ml-auto" onClick={() => handleDelete(d.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Size</TableHead>
                    <TableHead className="hidden sm:table-cell">Downloads</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => {
                    const fc = FILE_TYPE_CONFIG[d.fileType]
                    const FileIcon = fc.icon
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg ${fc.bgColor} ${fc.color} flex items-center justify-center shrink-0`}>
                              <FileIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate max-w-[200px]">{d.title}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{d.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${fc.bgColor} ${fc.color} text-xs h-5 border-0`}>
                            {fc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className={`${CATEGORY_COLORS[d.category as DocCategory] || 'bg-gray-50 text-gray-600'} text-xs h-5`}>
                            {d.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {d.fileSize}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {d.downloadCount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs h-5 ${d.isPublic ? 'text-emerald-600 border-emerald-200' : 'text-gray-500'}`}>
                            {d.isPublic ? 'Public' : 'Private'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary" className={`${STATUS_CONFIG[d.status]?.color || ''} text-xs h-5`}>
                            {STATUS_CONFIG[d.status]?.label || d.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(d)} title="Download">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(d.id)} title="Delete">
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
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDoc ? 'Edit Document' : 'Upload Document'}</DialogTitle>
            <DialogDescription>
              {editDoc ? 'Update document details' : 'Add a new document to the library'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. JEE Main 2025 Syllabus"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Document description..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>File Type</Label>
                <Select value={formFileType} onValueChange={(v) => setFormFileType(v as FileType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{FILE_TYPE_CONFIG[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as DocCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                placeholder="e.g. JEE, Syllabus, 2025"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formPublic} onCheckedChange={setFormPublic} />
              <Label>Public document</Label>
              <span className="text-xs text-muted-foreground">
                ({formPublic ? 'Visible to everyone' : 'Only visible to you'})
              </span>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={(v) => setFormStatus(v as DocStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editDoc ? 'Update' : 'Upload'} Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
