'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Search, FileText, Users, Download, Loader2, CheckCircle2, Lock, BookOpen } from 'lucide-react'

interface CatalogNotes {
  id: string
  title: string
  description: string
  price: number
  category: string | null
  subject: string | null
  fileUrl: string | null
  content: string
  teacher: { id: string; name: string | null; username: string; avatar: string | null }
  _count: { purchases: number }
  isPurchased: boolean
}

interface NotesDetail {
  notes: {
    id: string
    title: string
    description: string
    content: string
    fileUrl: string | null
    price: number
    hasAccess: boolean
    teacher: { id: string; name: string | null; username: string; avatar: string | null }
  }
}

export function NotesBrowser() {
  const [notes, setNotes] = useState<CatalogNotes[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [detail, setDetail] = useState<NotesDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchNotes = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    const res = await fetch(`/api/catalog/notes?${params}`)
    const data = await res.json()
    setNotes(data.notes || [])
    setCategories(data.categories || [])
    setLoading(false)
  }

  const fetchDetail = async (notesId: string) => {
    setDetailLoading(true)
    const res = await fetch(`/api/student/notes/${notesId}`)
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setDetailLoading(false); return }
    setDetail(data)
    setDetailLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(fetchNotes, 300)
    return () => clearTimeout(timer)
  }, [search, category])

  useEffect(() => { if (viewingId) fetchDetail(viewingId) }, [viewingId])

  const handlePurchase = async (notesId: string) => {
    setBuyingId(notesId)
    try {
      const res = await fetch('/api/student/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'NOTES', itemId: notesId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Purchased successfully! 🎉')
      fetchNotes()
      if (viewingId === notesId) fetchDetail(notesId)
    } finally { setBuyingId(null) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Study Notes</h2>
        <p className="text-sm text-muted-foreground">Download premium notes and study materials</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56" />)}</div>
      ) : notes.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">No notes found</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card key={note.id} className="hover:shadow-lg transition-all flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center"><FileText className="w-6 h-6 text-white" /></div>
                  {note.isPurchased && <Badge className="bg-emerald-600 gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Owned</Badge>}
                </div>
                <h3 className="font-semibold mb-1 line-clamp-1">{note.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{note.description}</p>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {note.category && <Badge variant="outline" className="text-xs">{note.category}</Badge>}
                  {note.subject && <Badge variant="outline" className="text-xs">{note.subject}</Badge>}
                  {note.fileUrl && <Badge variant="outline" className="text-xs gap-1"><Download className="w-3 h-3" /> PDF</Badge>}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="w-5 h-5"><AvatarFallback className="text-xs bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">{note.teacher.name?.charAt(0) || 'T'}</AvatarFallback></Avatar>
                  <span className="text-xs text-muted-foreground truncate">{note.teacher.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1"><Users className="w-3 h-3" /> {note._count.purchases}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-bold text-emerald-600">{note.price === 0 ? 'Free' : `₹${note.price}`}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setViewingId(note.id)}><BookOpen className="w-3.5 h-3.5 mr-1" /> View</Button>
                    {note.isPurchased || note.price === 0 ? null : (
                      <Button size="sm" onClick={() => handlePurchase(note.id)} disabled={buyingId === note.id} className="bg-emerald-600 hover:bg-emerald-700">
                        {buyingId === note.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null} Buy
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Notes viewer dialog */}
      <Dialog open={!!viewingId} onOpenChange={(open) => { if (!open) { setViewingId(null); setDetail(null) } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {detailLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
          ) : detail ? (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shrink-0"><FileText className="w-6 h-6 text-white" /></div>
                  <div className="flex-1">
                    <DialogTitle className="text-xl">{detail.notes.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">by {detail.notes.teacher.name}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{detail.notes.description}</p>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="font-bold text-lg text-emerald-600">{detail.notes.price === 0 ? 'Free' : `₹${detail.notes.price}`}</span>
                  {detail.notes.hasAccess ? (
                    detail.notes.fileUrl ? (
                      <Button asChild><a href={detail.notes.fileUrl} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4 mr-2" /> Download PDF</a></Button>
                    ) : (
                      <Badge className="bg-emerald-600 gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Access Granted</Badge>
                    )
                  ) : (
                    <Button onClick={() => handlePurchase(detail.notes.id)} disabled={buyingId === detail.notes.id} className="bg-emerald-600 hover:bg-emerald-700">
                      {buyingId === detail.notes.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Purchase for ₹{detail.notes.price}
                    </Button>
                  )}
                </div>
                <div className={`p-4 rounded-lg border ${detail.notes.hasAccess ? 'bg-card' : 'bg-muted/30'}`}>
                  {detail.notes.hasAccess ? (
                    <pre className="text-sm whitespace-pre-wrap font-sans">{detail.notes.content}</pre>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Lock className="w-8 h-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">Purchase these notes to unlock the full content</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
