import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import path from 'path'
import { randomUUID } from 'crypto'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'avatars'

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only JPEG, PNG, GIF, WebP, SVG, and ICO images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds 5MB limit.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = path.extname(file.name) || `.${file.type.split('/')[1]}`
    const filename = `${randomUUID()}${ext}`

    // Upload to Supabase Storage
    const filePath = `${folder}/${filename}`
    const bytes = await file.arrayBuffer()
    
    const { data, error } = await supabase.storage
      .from('files')
      .upload(filePath, bytes, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('[UPLOAD-IMAGE] Supabase upload error:', error)
      throw error
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('files')
      .getPublicUrl(filePath)

    const url = publicUrlData.publicUrl

    return NextResponse.json({
      success: true,
      url,
    })
  } catch (error) {
    console.error('[UPLOAD-IMAGE] Error uploading image:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to upload image.' },
      { status: 500 }
    )
  }
}
