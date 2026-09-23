'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog'
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, 
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Plus, FileText, Edit, Trash2, Eye, EyeOff, Users, Download, BookMarked } from 'lucide-react'

interface Notes {
  id: string
  title: string
  description: string
  content: string
  fileUrl: string | null
  price: number
  category: string | null
  subject: string | null
  isPublished: boolean
  _count: { purchases: number }
  createdAt: string
}

export function NotesManager() {
  const [notes, setNotes] = useState<Notes[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Notes | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '', description: '', content: '', fileUrl: '', price: '0', category: '', subject: ''
  })

  const fetchNotes = async () => {
    setLoading(true)
    const res = await fetch('/api/teacher/notes')
    const data = await res.json()
    setNotes(data.notes || [])
    setLoading(false)
  }

  useEffect(() => { fetchNotes() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', description: '', content: '', fileUrl: '', price: '0', category: '', subject: '' })
    setDialogOpen(true)
  }

  const openEdit = (note: Notes) => {
    setEditing(note)
    setForm({
      title: note.title,
      description: note.description,
      content: note.content,
      fileUrl: note.fileUrl || '',
      price: String(note.price),
      category: note.category || '',
      subject: note.subject || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editing ? `/api/teacher/notes/${editing.id}` : '/api/teacher/notes'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(editing ? 'Notes updated' : 'Notes created')
      setDialogOpen(false)
      fetchNotes()
    } finally { setSubmitting(false) }
  }

  const togglePublish = async (note: Notes) => {
    const res = await fetch(`/api/teacher/notes/${note.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPublished: !note.isPublished }) })
    if (res.ok) { toast.success(note.isPublished ? 'Unpublished' : 'Published'); fetchNotes() }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await fetch(`/api/teacher/notes/${deleteId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted'); fetchNotes() }
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Study Notes</h2>
          <p className="text-sm text-muted-foreground mt-1">Create and sell digital notes to students</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" /> Create Notes
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56" />)}</div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-4">No notes yet. Create your first set of notes!</p>
            <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Create First Notes
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card key={note.id} className="hover:shadow-lg transition-all flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  {note.isPublished ? <Badge className="bg-emerald-600">Published</Badge> : <Badge variant="secondary">Draft</Badge>}
                </div>
                <h3 className="font-semibold mb-1 line-clamp-1">{note.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{note.description}</p>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {note.category && <Badge variant="outline" className="text-xs">{note.category}</Badge>}
                  {note.subject && <Badge variant="outline" className="text-xs">{note.subject}</Badge>}
                  {note.fileUrl && <Badge variant="outline" className="text-xs gap-1"><Download className="w-3 h-3" /> PDF</Badge>}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {note._count.purchases} sold</span>
                  <span className="text-lg font-bold text-emerald-600">₹{note.price}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(note)}>
                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => togglePublish(note)}>
                    {note.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDeleteId(note.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Notes' : 'Create Notes'}</DialogTitle>
            <DialogDescription>{editing ? 'Update notes content' : 'Create study notes to sell to students'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input required placeholder="Physics Formulas - Chapter 1 to 5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea required placeholder="Brief description of what's covered in these notes..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea required placeholder="Write your notes content here..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} className="font-mono text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input placeholder="Physics" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input placeholder="Mechanics" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>PDF File URL (optional)</Label>
                  <Input placeholder="https://..." value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete these notes?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the notes. Students who purchased will lose access.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
