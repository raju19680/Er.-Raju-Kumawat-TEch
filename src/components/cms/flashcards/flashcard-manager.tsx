'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { apiFetchJSON } from '@/lib/api-client'
import { Plus, Search, Layers, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface FlashcardDeck {
  id: string
  title: string
  description: string | null
  _count: { flashcards: number }
}

export default function FlashcardManager() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  
  // New deck state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [courseId, setCourseId] = useState('')
  const [cards, setCards] = useState([{ front: '', back: '' }])

  async function loadDecks() {
    setLoading(true)
    try {
      const res = await apiFetchJSON<{ success: boolean; data: FlashcardDeck[] }>('/api/teacher/flashcards')
      if (res.success) setDecks(res.data)
    } catch (err) {
      toast.error('Failed to load flashcards')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDecks()
  }, [])

  const handleAddCard = () => {
    setCards([...cards, { front: '', back: '' }])
  }

  const handleUpdateCard = (index: number, field: 'front' | 'back', value: string) => {
    const newCards = [...cards]
    newCards[index][field] = value
    setCards(newCards)
  }

  const handleRemoveCard = (index: number) => {
    setCards(cards.filter((_, i) => i !== index))
  }

  const handleCreate = async () => {
    if (!title) return toast.error('Title is required')
    const validCards = cards.filter(c => c.front.trim() && c.back.trim())
    if (validCards.length === 0) return toast.error('Add at least one complete flashcard')

    try {
      const res = await apiFetchJSON('/api/teacher/flashcards', {
        method: 'POST',
        body: JSON.stringify({ title, description, courseId, cards: validCards })
      })
      if (res.success) {
        toast.success('Flashcard Deck created')
        setCreateOpen(false)
        loadDecks()
        setTitle(''); setDescription(''); setCourseId(''); setCards([{ front: '', back: '' }])
      }
    } catch (err) {
      toast.error('Failed to create flashcard deck')
    }
  }

  const filtered = decks.filter(d => d.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Interactive Flashcards</h1>
          <p className="text-sm text-muted-foreground">Create study decks for active recall learning.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Deck
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search decks..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
          <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold text-lg">No flashcard decks found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map(deck => (
            <Card key={deck.id} className="hover:shadow-md transition-all cursor-pointer border-emerald-100 hover:border-emerald-300">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg line-clamp-1">{deck.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 flex flex-col gap-3">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                  {deck.description || 'No description provided.'}
                </p>
                <div className="mt-2 text-xs font-medium bg-emerald-50 text-emerald-700 w-fit px-2 py-1 rounded-md">
                  {deck._count.flashcards} Cards
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create Flashcard Deck</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4 flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Deck Title</label>
                <Input placeholder="e.g. Physics Formulas" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Course ID (Optional)</label>
                <Input placeholder="Assign to specific course" value={courseId} onChange={e => setCourseId(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="Short description" value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Flashcards</h3>
                <Button variant="outline" size="sm" onClick={handleAddCard}><Plus className="w-4 h-4 mr-1" /> Add Card</Button>
              </div>
              
              <div className="space-y-4">
                {cards.map((card, idx) => (
                  <div key={idx} className="flex gap-4 p-4 border rounded-lg bg-slate-50 relative group">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Front</label>
                      <Textarea 
                        value={card.front} 
                        onChange={(e) => handleUpdateCard(idx, 'front', e.target.value)} 
                        className="bg-white resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Back</label>
                      <Textarea 
                        value={card.back} 
                        onChange={(e) => handleUpdateCard(idx, 'back', e.target.value)} 
                        className="bg-white resize-none"
                        rows={2}
                      />
                    </div>
                    {cards.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                        onClick={() => handleRemoveCard(idx)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Deck</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
