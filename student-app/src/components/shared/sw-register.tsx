'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker for PWA functionality.
 * Also handles update notifications.
 * NOTE: Disabled in development to prevent SW from intercepting API calls.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Disable SW in development to prevent API interception issues
    if (process.env.NODE_ENV === 'development') {
      // Unregister any existing service workers
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister())
      })
      return
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available - could show a toast here
                console.log('[PWA] New version available, reload to update')
              }
            })
          }
        })

        // Listen for messages from SW
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SKIP_WAITING') {
            window.location.reload()
          }
        })

        console.log('[PWA] Service Worker registered')
      } catch (error) {
        console.error('[PWA] SW registration failed:', error)
      }
    }

    // Register after page load
    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register)
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
