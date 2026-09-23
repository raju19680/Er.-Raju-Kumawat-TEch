export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { supabase } from '@/lib/supabase'
import path from 'path'
import { getAuthUser } from '@/lib/auth-helpers'

/**
 * POST /api/teacher/upload-image
 * POST /api/teacher/upload-image?type=video
 * POST /api/teacher/upload-image?type=pdf
 * POST /api/teacher/upload-image?type=audio
 * POST /api/teacher/upload-image?type=document
 *
 * Uploads a file and returns the public URL.
 * Supports images (thumbnails), videos, PDFs, audio, and documents.
 * The `type` query param controls allowed MIME types and size limits.
 */

const FILE_CONFIG: Record<string, { allowed: string[]; maxSize: number; label: string }> = {
  image: {
    allowed: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    maxSize: 5 * 1024 * 1024, // 5MB
    label: 'JPEG, PNG, WebP, GIF, SVG',
  },
  video: {
    allowed: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-matroska'],
    maxSize: 500 * 1024 * 1024, // 500MB
    label: 'MP4, WebM, OGG, MOV, MKV',
  },
  pdf: {
    allowed: ['application/pdf'],
    maxSize: 50 * 1024 * 1024, // 50MB
    label: 'PDF',
  },
  audio: {
    allowed: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/x-m4a', 'audio/mp4'],
    maxSize: 50 * 1024 * 1024, // 50MB
    label: 'MP3, WAV, OGG, AAC, M4A',
  },
  document: {
    allowed: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/markdown',
      'application/zip',
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    label: 'PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, MD, ZIP',
  },
  code: {
    allowed: ['text/plain', 'text/javascript', 'text/typescript', 'text/x-python', 'application/json', 'text/html', 'text/css'],
    maxSize: 5 * 1024 * 1024, // 5MB
    label: 'TXT, JS, TS, PY, JSON, HTML, CSS',
  },
}

function guessTypeFromMime(mime: string): string {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime === 'application/pdf') return 'pdf'
  return 'document'
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Determine upload type from query param or guess from MIME
    const url = new URL(req.url)
    const queryType = url.searchParams.get('type') || ''
    const uploadType = queryType && FILE_CONFIG[queryType]
      ? queryType
      : guessTypeFromMime(file.type)

    const config = FILE_CONFIG[uploadType] || FILE_CONFIG.image

    // Validate file type — accept if it's in the allowed list OR if it matches the category prefix
    const isAllowed = config.allowed.includes(file.type)
      || (uploadType === 'image' && file.type.startsWith('image/'))
      || (uploadType === 'video' && file.type.startsWith('video/'))
      || (uploadType === 'audio' && file.type.startsWith('audio/'))

    if (!isAllowed) {
      return NextResponse.json(
        { error: `Invalid file type "${file.type || 'unknown'}". Allowed for ${uploadType}: ${config.label}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > config.maxSize) {
      const maxMB = Math.round(config.maxSize / (1024 * 1024))
      return NextResponse.json({ error: `File too large. Max ${maxMB}MB for ${uploadType} files` }, { status: 400 })
    }

    // Generate filename with org-scoped subdirectory
    const ext = file.name.split('.').pop() || (uploadType === 'image' ? 'jpg' : uploadType === 'video' ? 'mp4' : uploadType === 'audio' ? 'mp3' : 'bin')
    const orgDir = auth.orgId || 'shared'
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`
    
    // Upload to Supabase Storage
    const filePath = `${orgDir}/${filename}`
    const buffer = Buffer.from(await file.arrayBuffer())
    
    const { data, error } = await supabase.storage
      .from('files')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('[TEACHER/UPLOAD-IMAGE] Supabase upload error:', error)
      throw error
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('files')
      .getPublicUrl(filePath)

    const publicUrl = publicUrlData.publicUrl

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      type: uploadType,
      size: file.size,
      originalName: file.name,
    })
  } catch (error) {
    console.error('Upload file error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}

