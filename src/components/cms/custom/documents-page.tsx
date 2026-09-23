'use client'

import React, { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
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
  Filter,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

interface Document {
  id: string
  title: string
  fileType: string
  size: string
  description: string
  downloadCount: number
  uploadedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const FILE_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PDF: { label: 'PDF', icon: FileText, color: 'bg-red-50 text-red-700' },
  DOC: { label: 'DOC', icon: FileText, color: 'bg-blue-50 text-blue-700' },
  XLS: { label: 'XLS', icon: FileSpreadsheet, color: 'bg-emerald-50 text-emerald-700' },
  IMG: { label: 'Image', icon: Image, color: 'bg-purple-50 text-purple-700' },
  PPT: { label: 'PPT', icon: File, color: 'bg-orange-50 text-orange-700' },
  ZIP: { label: 'ZIP', icon: Folder, color: 'bg-amber-50 text-amber-700' },
  OTHER: { label: 'Other', icon: File, color: 'bg-gray-50 text-gray-700' },
}

function getFileTypeConfig(type: string) {
  return FILE_TYPE_CONFIG[type] || FILE_TYPE_CONFIG.OTHER
}

// ─── Component ────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  // Data
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      title: 'JEE Physics Formula Sheet',
      fileType: 'PDF',
      size: '2.4 MB',
      description: 'Complete physics formula sheet for JEE preparation',
      downloadCount: 156,
      uploadedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '2',
      title: 'NEET Biology Notes - Chapter 1',
      fileType: 'DOC',
      size: '1.8 MB',
      description: 'Detailed biology notes for NEET preparation',
      downloadCount: 89,
      uploadedAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: '3',
      title: 'Student Progress Report Template',
      fileType: 'XLS',
      size: '512 KB',
      description: 'Excel template for tracking student progress',
      downloadCount: 34,
      uploadedAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: '4',
      title: 'Course Banner Images',
      fileType: 'IMG',
      size: '8.2 MB',
      description: 'Collection of banner images for courses',
      downloadCount: 12,
      uploadedAt: new Date(Date.now() - 345600000).toISOString(),
    },
    {
      id: '5',
      title: 'UPSC Study Material Pack',
      fileType: 'ZIP',
      size: '45.6 MB',
      description: 'Compressed study material pack for UPSC',
      downloadCount: 203,
      uploadedAt: new Date(Date.now() - 432000000).toISOString(),
    },
    {
      id: '6',
      title: 'Chemistry Periodic Table HD',
      fileType: 'IMG',
      size: '3.1 MB',
      description: 'High resolution periodic table for reference',
      downloadCount: 67,
      uploadedAt: new Date().toISOString(),
    },
  ])

  // Search & Filter
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formFileType, setFormFileType] = useState('PDF')
  const [formDescription, setFormDescription] = useState('')

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [docToDelete, setDocToDelete] = useState<Document | null>(null)

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    let result = documents
    if (typeFilter !== 'all') {
      result = result.filter((d) => d.fileType === typeFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      )
    }
    return result
  }, [documents, typeFilter, search])

  // ─── Upload ───────────────────────────────────────────────────────────

  const handleUpload = () => {
    if (!formTitle.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    setTimeout(() => {
      const newDoc: Document = {
        id: Date.now().toString(),
        title: formTitle.trim(),
        fileType: formFileType,
        size: '0 KB',
        description: formDescription.trim(),
        downloadCount: 0,
        uploadedAt: new Date().toISOString(),
      }
      setDocuments((prev) => [newDoc, ...prev])
      setUploadDialogOpen(false)
      setFormTitle('')
      setFormFileType('PDF')
      setFormDescription('')
      setSaving(false)
      toast.success('Document uploaded')
    }, 500)
  }

  // ─── Delete ───────────────────────────────────────────────────────────

  const handleDelete = () => {
    if (!docToDelete) return
    setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id))
    setDeleteDialogOpen(false)
    setDocToDelete(null)
    toast.success('Document deleted')
  }

  // ─── Stats ────────────────────────────────────────────────────────────

  const totalDownloads = useMemo(
    () => documents.reduce((acc, d) => acc + d.downloadCount, 0),
    [documents]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload and manage your documents and files
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white">
          <Upload className="size-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-blue-50">
              <File className="size-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Files</p>
              <p className="text-lg font-bold text-gray-900">{documents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-emerald-50">
              <Download className="size-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Downloads</p>
              <p className="text-lg font-bold text-gray-900">{totalDownloads}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl bg-white shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-full bg-amber-50">
              <FileText className="size-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">PDFs</p>
              <p className="text-lg font-bold text-gray-900">{documents.filter((d) => d.fileType === 'PDF').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-lg"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[140px] rounded-lg">
                <SelectValue placeholder="File type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="DOC">DOC</SelectItem>
                <SelectItem value="XLS">XLS</SelectItem>
                <SelectItem value="IMG">Image</SelectItem>
                <SelectItem value="PPT">PPT</SelectItem>
                <SelectItem value="ZIP">ZIP</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className={`h-7 text-xs ${viewMode === 'grid' ? 'bg-black hover:bg-gray-800 text-white' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className={`h-7 text-xs ${viewMode === 'list' ? 'bg-black hover:bg-gray-800 text-white' : ''}`}
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      {filteredDocuments.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                {search || typeFilter !== 'all' ? 'No documents found' : 'No documents yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search || typeFilter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Upload your first document'}
              </p>
              {!search && typeFilter === 'all' && (
                <Button onClick={() => setUploadDialogOpen(true)} className="mt-4 bg-black hover:bg-gray-800 text-white" size="sm">
                  <Upload className="size-4 mr-2" /> Upload Document
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const typeConfig = getFileTypeConfig(doc.fileType)
            const TypeIcon = typeConfig.icon
            return (
              <Card key={doc.id} className="rounded-xl hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${typeConfig.color.split(' ')[0]}`}>
                      <TypeIcon className={`size-5 ${typeConfig.color.split(' ')[1]}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-900 truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={typeConfig.color}>
                          {typeConfig.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{doc.size}</span>
                      </div>
                    </div>
                  </div>

                  {doc.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{doc.description}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Download className="size-3" />
                      {doc.downloadCount} downloads
                    </span>
                    <span>
                      {new Date(doc.uploadedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                      <Eye className="size-3 mr-1" /> View
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      <Download className="size-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 text-red-600 hover:text-red-700"
                      onClick={() => {
                        setDocToDelete(doc)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* List View */
        <Card className="rounded-xl">
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredDocuments.map((doc) => {
                const typeConfig = getFileTypeConfig(doc.fileType)
                const TypeIcon = typeConfig.icon
                return (
                  <div key={doc.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                    <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${typeConfig.color.split(' ')[0]}`}>
                      <TypeIcon className={`size-5 ${typeConfig.color.split(' ')[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{doc.description || 'No description'}</p>
                    </div>
                    <Badge variant="secondary" className={typeConfig.color + ' hidden sm:inline-flex'}>
                      {typeConfig.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden md:block w-16 text-right">{doc.size}</span>
                    <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1 w-24 justify-end">
                      <Download className="size-3" /> {doc.downloadCount}
                    </span>
                    <span className="text-xs text-muted-foreground hidden lg:block w-20">
                      {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Download className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500"
                        onClick={() => {
                          setDocToDelete(doc)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Upload Document Dialog ────────────────────────────────────── */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Add a new document to your library</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Document title" />
            </div>
            <div className="space-y-2">
              <Label>File Type</Label>
              <Select value={formFileType} onValueChange={setFormFileType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="DOC">DOC</SelectItem>
                  <SelectItem value="XLS">XLS</SelectItem>
                  <SelectItem value="IMG">Image</SelectItem>
                  <SelectItem value="PPT">PPT</SelectItem>
                  <SelectItem value="ZIP">ZIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description..." className="min-h-[60px]" />
            </div>
            {/* File upload area (visual only) */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer">
              <Upload className="size-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOC, XLS, PPT, Images, ZIP up to 50MB</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button className="bg-black hover:bg-gray-800 text-white" onClick={handleUpload} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Dialog ─────────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{docToDelete?.title}&rdquo;? This action cannot be undone.
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
