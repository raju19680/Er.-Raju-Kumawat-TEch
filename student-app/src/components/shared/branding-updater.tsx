'use client'

import { useEffect } from 'react'

import { useAppStore } from '@/lib/store'

export function BrandingUpdater() {
  const orgCode = useAppStore(state => state.orgCode)

  
  const resolveMediaUrl = (url: string | null) => {
    if (!url) return ''
    if (url.startsWith('http') || url.startsWith('data:')) return url
    if (url.startsWith('/uploads/')) return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${url}`
    if (url.length === 25 && url.startsWith('c')) return `/api/media/${url}`
    return url
  }

  useEffect(() => {
    async function fetchBranding() {
      try {
        const url = orgCode ? `/api/public/portal-data?orgCode=${encodeURIComponent(orgCode)}` : '/api/public/portal-data'
        const res = await fetch(url)
        const data = await res.json()
        
        if (data?.branding) {
          const { orgName, favicon, logo } = data.branding
          
          if (orgName) {
            document.title = orgName
            // Update store so it's globally available
            useAppStore.getState().setOrg(orgCode || data.org?.code || '', orgName, resolveMediaUrl(logo))
          }
          
          if (favicon) {
            // Specifically target standard icons, avoid apple-touch-icon if possible
            let links = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']")
            
            if (links.length === 0) {
              const link = document.createElement('link')
              link.rel = 'icon'
              link.href = resolveMediaUrl(favicon)
              document.head.appendChild(link)
            } else {
              links.forEach((link) => {
                (link as HTMLLinkElement).href = resolveMediaUrl(favicon)
              })
            }
          }
        }
      } catch (err) {
        console.error('Failed to update branding:', err)
      }
    }
    fetchBranding()
  }, [orgCode])

  return null
}
