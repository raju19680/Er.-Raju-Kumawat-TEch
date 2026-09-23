'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X, Download, Smartphone } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// ─── Constants ──────────────────────────────────────────────────────────────
const DISMISS_KEY = 'erkt_pwa_dismissed'
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// ─── PWA Install Prompt Component ───────────────────────────────────────────
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  // Check if prompt was recently dismissed
  const wasRecentlyDismissed = useCallback(() => {
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY)
      if (!dismissedAt) return false
      const elapsed = Date.now() - parseInt(dismissedAt, 10)
      return elapsed < DISMISS_DURATION_MS
    } catch {
      return false
    }
  }, [])

  // Listen for beforeinstallprompt event
  useEffect(() => {
    // Only show in browser context
    if (typeof window === 'undefined') return

    const handler = (e: Event) => {
      // Prevent the default mini-infobar
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent

      if (!wasRecentlyDismissed()) {
        setDeferredPrompt(promptEvent)
        // Show prompt after a small delay for better UX
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Also register the service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope)
      }).catch((error) => {
        console.log('[PWA] Service Worker registration failed:', error)
      })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [wasRecentlyDismissed])

  // Handle install click
  const handleInstall = async () => {
    if (!deferredPrompt) return

    setIsInstalling(true)
    try {
      await deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice

      if (result.outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt')
      } else {
        console.log('[PWA] User dismissed install prompt')
      }
    } catch (error) {
      console.error('[PWA] Install prompt error:', error)
    } finally {
      setDeferredPrompt(null)
      setShowPrompt(false)
      setIsInstalling(false)
    }
  }

  // Handle dismiss
  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString())
    } catch {
      // localStorage not available
    }
    setShowPrompt(false)
  }

  return (
    <AnimatePresence>
      {showPrompt && deferredPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 border border-amber-100">
                <Smartphone className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">
                  Install ERKT App
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Add Er. Raju Kumawat Tech to your home screen for quick access and offline support.
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 -m-1 cursor-pointer"
                aria-label="Dismiss install prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 h-9 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg cursor-pointer"
              >
                {isInstalling ? (
                  <span className="flex items-center gap-1.5">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Installing...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    Install App
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="h-9 text-xs font-medium rounded-lg text-gray-600 cursor-pointer"
              >
                Not Now
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
