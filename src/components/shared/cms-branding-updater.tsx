'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'

export function CmsBrandingUpdater() {
  const setAdminBranding = useAppStore((s) => s.setAdminBranding)

  
  const resolveMediaUrl = (url: string | null) => {
    if (!url) return ''
    if (url.startsWith('http') || url.startsWith('data:')) return url
    if (url.startsWith('/uploads/')) return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${url}`
    if (url.length === 25 && url.startsWith('c')) return `/api/media/${url}`
    return url
  }

  useEffect(() => {
    const fetchAdminBranding = async () => {
      try {
        const data = await apiFetchJSON<{ success: boolean; logo: string | null; name: string }>('/api/public/admin-branding')
        if (data && data.success) {
          setAdminBranding({ logo: data.logo, name: data.name })
          // Update favicon dynamically
          if (data.logo) {
            let links = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']")
            if (links.length === 0) {
              const link = document.createElement('link')
              link.rel = 'icon'
              link.href = resolveMediaUrl(data.logo)
              document.head.appendChild(link)
            } else {
               links.forEach((link) => {
                 (link as HTMLLinkElement).href = resolveMediaUrl(data.logo)
               })
            }
          }
          if (data.name) {
            document.title = `${data.name} - Teacher Panel`
          }
        }
      } catch (error) {
        console.error('Failed to fetch admin branding:', error)
      }
    }
    fetchAdminBranding()
  }, [setAdminBranding])

  return null
}
