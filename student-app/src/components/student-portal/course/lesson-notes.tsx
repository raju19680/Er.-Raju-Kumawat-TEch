import { useState, useEffect } from 'react'
import { apiFetchJSON, apiFetch } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Clock, Trash2 } from 'lucide-react'

export function LessonNotes({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchNotes = async () => {
    try {
      const res = await apiFetchJSON<any>(`/api/student/courses/${courseId}/notes?lessonId=${lessonId}`)
      if (res.success) {
        setNotes(res.notes)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [lessonId])

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    // Try to get current video time if there's a video player
    let timestamp: number | null = null
    const videoEl = document.querySelector('video')
    if (videoEl) {
      timestamp = Math.floor(videoEl.currentTime)
    }

    setSubmitting(true)
    try {
      const res = await apiFetchJSON<any>(`/api/student/courses/${courseId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          content: newNote.trim(),
          timestamp
        })
      })

      if (res.success) {
        setNewNote('')
        fetchNotes()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return
    try {
      await apiFetch(`/api/student/courses/${courseId}/notes?id=${noteId}`, {
        method: 'DELETE'
      })
      fetchNotes()
    } catch (e) {
      console.error(e)
    }
  }

  const jumpToTime = (timestamp: number) => {
    const videoEl = document.querySelector('video')
    if (videoEl) {
      videoEl.currentTime = timestamp
      videoEl.play().catch(() => {})
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (loading) {
    return <div className="py-8 text-center text-gray-500"><Loader2 className="size-6 animate-spin mx-auto" /></div>
  }

  return (
    <div className="space-y-4 mt-8">
      <h3 className="font-bold text-lg text-gray-900 border-b pb-2">My Smart Notes</h3>
      
      <div className="flex gap-2">
        <Input 
          placeholder="Type your note here..." 
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
        />
        <Button onClick={handleAddNote} disabled={submitting || !newNote.trim()} className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
          {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />} Add Note
        </Button>
      </div>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-xl">No notes taken for this lesson yet. Write a note while watching to timestamp it!</p>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className="bg-amber-50/30 border-amber-100">
              <CardContent className="p-4 flex gap-3 group">
                <div className="flex-1">
                  {note.timestamp !== null && (
                    <button 
                      onClick={() => jumpToTime(note.timestamp)}
                      className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full mb-2 hover:bg-amber-200 transition"
                      title="Jump to time"
                    >
                      <Clock className="size-3" /> {formatTime(note.timestamp)}
                    </button>
                  )}
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(note.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 size-8">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
