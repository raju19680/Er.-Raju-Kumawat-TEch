import React, { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MediaImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined
  fallbackIcon?: React.ReactNode
  aspectRatio?: string
}

export function MediaImage({
  src,
  alt = '',
  className,
  fallbackIcon,
  aspectRatio,
  ...props
}: MediaImageProps) {
  const [error, setError] = useState(false)
  
  const resolveUrl = (url: string | null | undefined) => {
    if (!url) return ''
    if (url.startsWith('http') || url.startsWith('data:')) return url
    if (url.startsWith('/uploads/')) {
      return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${url}`
    }
    // If it's a raw CUID/UUID ID, might be served by a /api/media route in some systems
    if (url.length === 25 && url.startsWith('c')) {
        return `/api/media/${url}`
    }
    return url
  }

  const finalSrc = resolveUrl(src)

  if (!finalSrc || error) {
    return (
      <div 
        className={cn("bg-muted flex items-center justify-center text-muted-foreground w-full h-full", className)}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        {fallbackIcon || <ImageIcon className="w-1/3 h-1/3 opacity-20" />}
      </div>
    )
  }

  return (
    <img
      src={finalSrc}
      alt={alt}
      onError={() => setError(true)}
      className={cn("object-cover w-full h-full", className)}
      style={aspectRatio ? { aspectRatio } : undefined}
      {...props}
    />
  )
}
