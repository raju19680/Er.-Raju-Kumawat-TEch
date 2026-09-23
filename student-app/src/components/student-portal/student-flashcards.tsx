'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, RotateCcw, LayoutGrid } from 'lucide-react'
import { apiFetchJSON } from '@/lib/api-client'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

interface Flashcard {
  id: string
  front: string
  back: string
  sortOrder: number
}

interface FlashcardDeck {
  id: string
  title: string
  description: string | null
  courseId: string | null
  flashcards: Flashcard[]
}

export default function StudentFlashcards() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([])
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  async function loadDecks() {
    try {
      const res = await apiFetchJSON<{ success: boolean; data: FlashcardDeck[] }>('/api/student/flashcards')
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

  const handleNext = () => {
    if (!activeDeck) return
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, activeDeck.flashcards.length - 1))
    }, 150)
  }

  const handlePrev = () => {
    if (!activeDeck) return
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => Math.max(prev - 1, 0))
    }, 150)
  }

  if (loading) return <div className="text-center py-20">Loading flashcards...</div>

  if (!activeDeck) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interactive Flashcards</h1>
          <p className="text-muted-foreground text-sm">Test your knowledge and memorize key concepts.</p>
        </div>

        {decks.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed">
            <LayoutGrid className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
            <h3 className="font-semibold text-gray-900">No flashcard decks found</h3>
            <p className="text-sm text-gray-500 mt-1">Check back later when your teachers add new study materials.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {decks.map(deck => (
              <Card 
                key={deck.id} 
                className="p-5 hover:shadow-md transition-shadow cursor-pointer border-emerald-100 hover:border-emerald-300"
                onClick={() => {
                  setActiveDeck(deck)
                  setCurrentIndex(0)
                  setIsFlipped(false)
                }}
              >
                <h3 className="font-semibold text-lg line-clamp-1">{deck.title}</h3>
                {deck.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{deck.description}</p>}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">
                    {deck.flashcards.length} Cards
                  </span>
                  <Button variant="ghost" size="sm" className="h-9 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                    Study Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  const currentCard = activeDeck.flashcards[currentIndex]

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setActiveDeck(null)} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Back to Decks
        </Button>
        <span className="text-sm font-medium text-muted-foreground">
          Card {currentIndex + 1} of {activeDeck.flashcards.length}
        </span>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold">{activeDeck.title}</h2>
      </div>

      <div className="relative h-[400px] w-full max-w-2xl mx-auto perspective-1000">
        <AnimatePresence mode="wait">
          {currentCard && (
            <motion.div
              key={currentCard.id + (isFlipped ? '-back' : '-front')}
              initial={{ rotateX: isFlipped ? -90 : 90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: isFlipped ? 90 : -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <Card className={`w-full h-full flex flex-col items-center justify-center p-8 text-center shadow-lg border-2 ${isFlipped ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'}`}>
                <span className="absolute top-4 left-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  {isFlipped ? 'Back' : 'Front'}
                </span>
                <p className={`text-2xl font-medium whitespace-pre-wrap ${isFlipped ? 'text-indigo-900' : 'text-gray-900'}`}>
                  {isFlipped ? currentCard.back : currentCard.front}
                </p>
                <div className="absolute bottom-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <RotateCcw className="w-3.5 h-3.5" /> Tap to flip
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-center items-center gap-4 mt-8">
        <Button 
          variant="outline" 
          size="lg" 
          disabled={currentIndex === 0}
          onClick={handlePrev}
          className="w-32 gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </Button>
        <Button 
          variant="default" 
          size="lg" 
          disabled={currentIndex === activeDeck.flashcards.length - 1}
          onClick={handleNext}
          className="w-32 gap-2"
        >
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
