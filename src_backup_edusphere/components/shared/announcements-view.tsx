'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, 
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store'
import { 
  Bell, Plus, Pin, Trash2, Megaphone, AlertTriangle, Sparkles, Wrench, Trophy, Clock 
} from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  targetType: string
  isPinned: boolean
  createdAt: string
  creator: { id: string; name: string | null; role: string }
  teacher: { id: string; name: string | null } | null
}

const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; label: string }> = {
  GENERAL: { icon: Megaphone, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', label: 'General' },
  MAINTENANCE: { icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', label: 'Maintenance' },
  FEATURE: { icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', label: 'New Feature' },
  URGENT: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', label: 'Urgent' },
  ACHIEVEMENT: { icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30', label: 'Achievement' },
}

export function AnnouncementsView() {
  const user = useAuthStore((s) => s.user)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', type: 'GENERAL', targetType: 'ALL', isPinned: false })

  const canCreate = user?.role === 'ADMIN' || user?.role === 'TEACHER'

  const fetchAnnouncements = async () => {
    setLoading(true)
    const res = await fetch('/api/announcements')
    const data = await res.json()
    setAnnouncements(data.announcements || [])
    setLoading(false)
  }

  useEffect(() => { fetchAnnouncements() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Announcement published!')
      setDialogOpen(false)
      setForm({ title: '', content: '', type: 'GENERAL', targetType: 'ALL', isPinned: false })
      fetchAnnouncements()
    } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await fetch(`/api/announcements?id=${deleteId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Announcement deleted'); fetchAnnouncements() }
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-600" /> Announcements
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {canCreate ? 'Publish announcements to your audience' : 'Stay updated with latest announcements'}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" /> New Announcement
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No announcements yet</p>
            {canCreate && (
              <Button onClick={() => setDialogOpen(true)} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" /> Create First Announcement
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const config = typeConfig[ann.type] || typeConfig.GENERAL
            return (
              <Card key={ann.id} className={`overflow-hidden ${ann.isPinned ? 'border-emerald-300 dark:border-emerald-800' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                      <config.icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {ann.isPinned && <Pin className="w-3.5 h-3.5 text-emerald-600" />}
                        <h3 className="font-semibold">{ann.title}</h3>
                        <Badge variant="outline" className={`text-xs ${config.bg} ${config.color} border-0`}>{config.label}</Badge>
                        {ann.teacher && <Badge variant="outline" className="text-xs">From {ann.teacher.name}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-[10px] bg-muted">
                              {ann.creator.name?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{ann.creator.name}</span>
                        </div>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(ann.createdAt).toLocaleString()}</span>
                        {canCreate && (user?.role === 'ADMIN' || ann.teacher?.id === user?.id) && (
                          <Button variant="ghost" size="sm" className="ml-auto h-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(ann.id)}>
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
            <DialogDescription>
              {user?.role === 'ADMIN' ? 'Publish to all users, teachers, or students' : 'Publish to your students'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input required placeholder="Important update about..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea required placeholder="Write your announcement..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">General</SelectItem>
                      <SelectItem value="FEATURE">New Feature</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="ACHIEVEMENT">Achievement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {user?.role === 'ADMIN' && (
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select value={form.targetType} onValueChange={(v) => setForm({ ...form, targetType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Users</SelectItem>
                        <SelectItem value="TEACHERS">Teachers Only</SelectItem>
                        <SelectItem value="STUDENTS">Students Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                <input type="checkbox" id="isPinned" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} className="w-4 h-4 rounded" />
                <Label htmlFor="isPinned" className="cursor-pointer flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5" />
                  <span className="font-medium">Pin this announcement</span>
                </Label>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? 'Publishing...' : 'Publish'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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
