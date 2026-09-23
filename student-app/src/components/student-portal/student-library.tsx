'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Library,
  BookOpen,
  FileText,
  Package,
  Download,
  Loader2,
  AlertCircle,
  RotateCcw,
  Clock,
  ExternalLink,
  Eye,
  Search,
  Check,
  Sigma,
  Sparkles,
  Sun,
  Moon,
  Coffee,
  Bookmark,
  Share2,
  Lock,
  ArrowLeft,
  Calendar,
  Layers,
  Plus,
  Folder,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { SecurePdfViewer } from '@/components/shared/secure-pdf-viewer'

interface PurchasedDigitalProduct {
  id: string
  digitalProductId: string
  accessUrl: string | null
  expiresAt: string | null
  createdAt: string
  digitalProduct: {
    id: string
    title: string
    description: string | null
    thumbnail: string | null
    file: string | null
    type: string
    category: string | null
    price: number
    mrp: number
  }
}

interface StudyDocument {
  id: string
  title: string
  description: string | null
  content: string | null
  fileUrl: string | null
  fileType: string
  category: string | null
  tags: string | null
  createdAt: string
  allowDownload?: boolean
  passwordProtected?: boolean
}

export default function StudentLibrary() {
  const { setStudentPage } = useAppStore()
  const [activeTab, setActiveTab] = useState<'notes' | 'purchases' | 'bookmarks'>('notes')
  const [products, setProducts] = useState<PurchasedDigitalProduct[]>([])
  const [documents, setDocuments] = useState<StudyDocument[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Reader state
  const [selectedDoc, setSelectedDoc] = useState<StudyDocument | null>(null)
  const [readingTheme, setReadingTheme] = useState<'light' | 'sepia' | 'dark'>('light')
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [prodRes, docRes] = await Promise.allSettled([
        apiFetchJSON<{ success: boolean; products: PurchasedDigitalProduct[] }>(
          '/api/student/digital-products/library'
        ),
        apiFetchJSON<{ success: boolean; documents: StudyDocument[] }>(
          '/api/student/library/documents'
        ),
      ])

      if (prodRes.status === 'fulfilled' && prodRes.value.success) {
        setProducts(prodRes.value.products || [])
      }
      if (docRes.status === 'fulfilled' && docRes.value.success) {
        setDocuments(docRes.value.documents || [])
      }
    } catch (err) {
      console.error('Library load error:', err)
      setError('Failed to load your study materials.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredDocs = documents.filter((d) => {
    const s = search.toLowerCase()
    return (
      d.title.toLowerCase().includes(s) ||
      (d.description && d.description.toLowerCase().includes(s)) ||
      (d.category && d.category.toLowerCase().includes(s))
    )
  })

  const handleDownloadProduct = (item: PurchasedDigitalProduct) => {
    const url = item.accessUrl || item.digitalProduct.file
    if (!url) {
      toast.error('No download available for this product')
      return
    }
    window.open(url, '_blank')
    toast.success('Download started!')
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">My Study Library</h1>
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
              PORTAL
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Access chapter notes, formulas, PDF guides, and your purchased materials
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notes, formulas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button
          variant={activeTab === 'notes' ? 'default' : 'ghost'}
          size="sm"
          className="gap-2 font-medium"
          onClick={() => setActiveTab('notes')}
        >
          <BookOpen className="size-4" />
          Study Notes & Formulas ({filteredDocs.length})
        </Button>
        <Button
          variant={activeTab === 'purchases' ? 'default' : 'ghost'}
          size="sm"
          className="gap-2 font-medium"
          onClick={() => setActiveTab('purchases')}
        >
          <Package className="size-4" />
          Purchased E-Books ({products.length})
        </Button>
      </div>

      {/* ── Content Area ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-9 w-full" />
            </Card>
          ))}
        </div>
            ) : activeTab === 'bookmarks' ? (
        <div className="space-y-6">
          <div className="flex gap-4 items-center">
            <h2 className="text-lg font-semibold">My Collections</h2>
            <Button variant="outline" size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Collection</Button>
          </div>
          {collections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">No collections yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map(c => (
                <Card key={c.id} className="hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-semibold"><Folder className="w-5 h-5 text-emerald-500" /> {c.name}</div>
                    {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                    <p className="text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">{c._count?.bookmarks || 0} items</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="pt-6 border-t">
            <h2 className="text-lg font-semibold mb-4">Saved Bookmarks</h2>
            {bookmarks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">No bookmarks yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bookmarks.map(b => (
                  <div key={b.id} className="flex flex-col gap-2 p-3 border rounded-lg bg-card hover:border-emerald-200 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-sm text-emerald-700">{b.title}</h4>
                      <Badge variant="outline" className="text-xs uppercase tracking-wider">{b.resourceType}</Badge>
                    </div>
                    {b.collection && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Folder className="w-3 h-3" /> {b.collection.name}</div>
                    )}
                    {b.tags && b.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {b.tags.map((t: any) => (
                          <span key={t.id} className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700">{t.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'notes' ? (
        filteredDocs.length === 0 ? (
          <div className="text-center py-16 bg-gray-50/50 rounded-xl border border-dashed">
            <BookOpen className="size-12 mx-auto mb-3 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900">No notes available</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Your instructors will publish revision notes, cheat sheets, and formula banks here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc, idx) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow border-gray-200 overflow-hidden flex flex-col h-full group">
                  <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-600 text-white">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <Badge variant="outline" className="bg-white text-xs text-amber-800 border-amber-300">
                          {doc.category || 'Study Note'}
                        </Badge>
                      </div>
                    </div>
                    {doc.fileType === 'pdf' && (
                      <Badge className="bg-red-100 text-red-700 text-xs">PDF</Badge>
                    )}
                  </div>

                  <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base line-clamp-2 group-hover:text-amber-600 transition-colors">
                        {doc.title}
                      </h3>
                      {doc.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{doc.description}</p>
                      )}
                    </div>

                    <div className="space-y-3 pt-2 border-t text-xs text-gray-500">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          <Sparkles className="size-3" /> Ready
                        </span>
                      </div>

                      <Button
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium gap-2"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <Eye className="size-4" />
                        Open & Read Notes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        /* ── Purchased E-Books & Store Items ── */
        products.length === 0 ? (
          <div className="text-center py-16 bg-gray-50/50 rounded-xl border border-dashed">
            <Package className="size-12 mx-auto mb-3 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900">No purchased digital products</h3>
            <p className="text-xs text-gray-500 mt-1">E-books and packages you buy from the store will appear here.</p>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => setStudentPage('store')}>
              Browse Store
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.map((item, idx) => (
              <Card key={item.id} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-32 bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white relative">
                  <BookOpen className="size-10 opacity-80" />
                  <Badge className="absolute top-2 right-2 bg-emerald-500 text-white text-xs">Owned</Badge>
                </div>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.digitalProduct.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{item.digitalProduct.description}</p>
                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium gap-1.5"
                    onClick={() => handleDownloadProduct(item)}
                  >
                    <Download className="size-3.5" />
                    Download File
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {/* ── Interactive Study Reader Dialog ── */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
          {selectedDoc && (
            <>
              {/* Reader Header & Theme Toolbar */}
              <div className="p-4 border-b bg-gray-50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300">
                    {selectedDoc.category || 'Study Notes'}
                  </Badge>
                  <h2 className="font-bold text-gray-900 text-base truncate max-w-md">{selectedDoc.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  {/* Theme buttons */}
                  <div className="flex items-center bg-gray-200/70 p-0.5 rounded-lg">
                    <button
                      onClick={() => setReadingTheme('light')}
                      className={`p-1.5 rounded-md ${readingTheme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                      title="Light Theme"
                    >
                      <Sun className="size-4" />
                    </button>
                    <button
                      onClick={() => setReadingTheme('sepia')}
                      className={`p-1.5 rounded-md ${readingTheme === 'sepia' ? 'bg-[#FBF0D9] text-[#5F4B32] shadow-sm' : 'text-gray-500'}`}
                      title="Sepia Theme"
                    >
                      <Coffee className="size-4" />
                    </button>
                    <button
                      onClick={() => setReadingTheme('dark')}
                      className={`p-1.5 rounded-md ${readingTheme === 'dark' ? 'bg-gray-900 text-gray-100 shadow-sm' : 'text-gray-500'}`}
                      title="Dark Theme"
                    >
                      <Moon className="size-4" />
                    </button>
                  </div>

                  {/* Font Sizer */}
                  <div className="flex items-center bg-gray-200/70 p-0.5 rounded-lg text-xs font-semibold text-gray-700">
                    <button
                      onClick={() => setFontSize('sm')}
                      className={`px-2 py-1 rounded-md ${fontSize === 'sm' ? 'bg-white shadow-sm' : ''}`}
                    >
                      A-
                    </button>
                    <button
                      onClick={() => setFontSize('base')}
                      className={`px-2 py-1 rounded-md ${fontSize === 'base' ? 'bg-white shadow-sm' : ''}`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setFontSize('lg')}
                      className={`px-2 py-1 rounded-md ${fontSize === 'lg' ? 'bg-white shadow-sm' : ''}`}
                    >
                      A+
                    </button>
                  </div>
                </div>
              </div>

              {/* Reader Body */}
              <div
                className={`flex-1 p-6 md:p-8 overflow-y-auto ${
                  readingTheme === 'sepia'
                    ? 'bg-[#FCF5E5] text-[#433422]'
                    : readingTheme === 'dark'
                    ? 'bg-gray-900 text-gray-100'
                    : 'bg-white text-gray-800'
                }`}
              >
                {selectedDoc.fileType === 'pdf' && selectedDoc.fileUrl ? (
                  <SecurePdfViewer
                    url={selectedDoc.fileUrl}
                    title={selectedDoc.title}
                    allowDownload={selectedDoc.allowDownload}
                    isPasswordProtected={selectedDoc.passwordProtected}
                  />
                ) : (
                  <div
                    className={`space-y-4 max-w-3xl mx-auto leading-relaxed ${
                      fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm'
                    }`}
                  >
                    <h1 className="text-2xl font-bold border-b pb-3">{selectedDoc.title}</h1>
                    {selectedDoc.description && (
                      <p className="italic opacity-80">{selectedDoc.description}</p>
                    )}

                    {selectedDoc.content ? (
                      selectedDoc.content.split('\n\n').map((block, idx) => {
                        if (block.startsWith('# ')) {
                          return <h2 key={idx} className="text-xl font-bold pt-3">{block.replace('# ', '')}</h2>
                        }
                        if (block.startsWith('## ')) {
                          return <h3 key={idx} className="text-lg font-semibold pt-2">{block.replace('## ', '')}</h3>
                        }
                        if (block.startsWith('> ')) {
                          return (
                            <div key={idx} className="p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg font-medium">
                              {block.replace(/^>\s*/gm, '')}
                            </div>
                          )
                        }
                        if (block.startsWith('```')) {
                          const cleanCode = block.replace(/```[a-z]*\n?/gi, '')
                          return (
                            <pre key={idx} className="p-4 bg-black/80 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto">
                              <code>{cleanCode}</code>
                            </pre>
                          )
                        }
                        if (block.startsWith('$$') && block.endsWith('$$')) {
                          return (
                            <div key={idx} className="my-3 p-3 bg-purple-500/10 border border-purple-400/30 rounded-xl text-center font-mono text-base">
                              {block.replace(/\$\$/g, '').trim()}
                            </div>
                          )
                        }
                        if (block.includes('- [ ]') || block.includes('- [x]')) {
                          const items = block.split('\n')
                          return (
                            <div key={idx} className="space-y-1 my-2">
                              {items.map((it, i) => {
                                const checked = it.includes('- [x]')
                                const text = it.replace(/- \[[ x]\]\s*/, '')
                                return (
                                  <div key={i} className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded flex items-center justify-center border ${checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-400'}`}>
                                      {checked && <Check className="h-3 w-3" />}
                                    </span>
                                    <span className={checked ? 'line-through opacity-60' : ''}>{text}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        }
                        return <p key={idx}>{block}</p>
                      })
                    ) : (
                      <p className="italic opacity-60">No written content available for this note.</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
