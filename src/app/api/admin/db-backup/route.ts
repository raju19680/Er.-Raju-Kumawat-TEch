export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin } from '@/lib/auth-helpers'
import fs from 'fs'
import path from 'path'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Resolve the SQLite database file path from the DATABASE_URL env variable.
 * DATABASE_URL format: "file:./db/custom.db"
 */
function resolveDbPath(): { relativePath: string; absolutePath: string } {
  const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
  // Strip the "file:" prefix
  const relativePath = databaseUrl.replace(/^file:/, '')
  const absolutePath = path.resolve(process.cwd(), relativePath)
  return { relativePath, absolutePath }
}

// ── GET: List all backup records with stats ──────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    // ── Auth check ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    // ── Get all backups ──
    const backups = await db.dbBackup.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // ── Compute stats ──
    const total = backups.length
    const completed = backups.filter((b) => b.status === 'completed').length
    const failed = backups.filter((b) => b.status === 'failed').length
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0)

    // ── Get DB file info ──
    const { relativePath, absolutePath } = resolveDbPath()
    let dbSize = 0
    let dbSizeFormatted = 'Unknown'
    try {
      const stats = fs.statSync(absolutePath)
      dbSize = stats.size
      dbSizeFormatted = formatBytes(dbSize)
    } catch {
      // DB file might not be accessible
    }

    return NextResponse.json({
      success: true,
      backups: backups.map((b) => ({
        id: b.id,
        filename: b.filename,
        size: b.size,
        sizeFormatted: formatBytes(b.size),
        status: b.status,
        triggeredBy: b.triggeredBy,
        triggeredByName: b.triggeredByName,
        notes: b.notes,
        createdAt: b.createdAt.toISOString(),
      })),
      stats: {
        total,
        completed,
        failed,
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
      },
      dbInfo: {
        path: relativePath,
        size: dbSize,
        sizeFormatted: dbSizeFormatted,
      },
    })
  } catch (error) {
    console.error('Admin db-backup GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}

// ── POST: Create a new backup ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const user = authResult.user
    const body = await req.json().catch(() => ({}))
    const notes = body.notes || null

    // ── Resolve database file path ──
    const { absolutePath } = resolveDbPath()

    // ── Verify the database file exists ──
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json(
        { success: false, message: 'Database file not found.' },
        { status: 404 }
      )
    }

    // ── Create backup directory ──
    const backupDir = path.resolve(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // ── Generate filename ──
    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const filename = `backup_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.db`
    const backupPath = path.join(backupDir, filename)

    // ── Copy the database file ──
    try {
      fs.copyFileSync(absolutePath, backupPath)
    } catch (copyError) {
      console.error('Failed to copy database file:', copyError)
      return NextResponse.json(
        { success: false, message: 'Failed to create backup file on disk.' },
        { status: 500 }
      )
    }

    // ── Get backup file size ──
    let backupSize = 0
    try {
      const stats = fs.statSync(backupPath)
      backupSize = stats.size
    } catch {
      // Fallback to 0 if can't read size
    }

    // ── Create backup record in database ──
    const backup = await db.dbBackup.create({
      data: {
        filename,
        size: backupSize,
        status: 'completed',
        triggeredBy: user.id,
        triggeredByName: user.name,
        notes,
      },
    })

    return NextResponse.json({
      success: true,
      backup: {
        id: backup.id,
        filename: backup.filename,
        size: backup.size,
        sizeFormatted: formatBytes(backup.size),
        status: backup.status,
        triggeredBy: backup.triggeredBy,
        triggeredByName: backup.triggeredByName,
        notes: backup.notes,
        createdAt: backup.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Admin db-backup POST error:', error)

    // If we have a partial backup file, try to record it as failed
    try {
      const body = await new Request(req).json().catch(() => ({}))
      const now = new Date()
      const pad = (n: number) => n.toString().padStart(2, '0')
      const filename = `backup_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.db`

      await db.dbBackup.create({
        data: {
          filename,
          size: 0,
          status: 'failed',
          notes: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      })
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error. Backup creation failed.' },
      { status: 500 }
    )
  }
}

// ── DELETE: Delete a backup record and file ──────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    // ── Auth check ──
    const authResult = await requirePlatformAdmin(req)
    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Backup ID is required.' },
        { status: 400 }
      )
    }

    // ── Find the backup record ──
    const backup = await db.dbBackup.findUnique({
      where: { id },
    })

    if (!backup) {
      return NextResponse.json(
        { success: false, message: 'Backup record not found.' },
        { status: 404 }
      )
    }

    // ── Delete the backup file from disk ──
    const backupDir = path.resolve(process.cwd(), 'backups')
    const backupPath = path.join(backupDir, backup.filename)
    try {
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath)
      }
    } catch (deleteError) {
      console.error('Failed to delete backup file:', deleteError)
      // Continue to delete the record even if file deletion fails
    }

    // ── Delete the database record ──
    await db.dbBackup.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully.',
    })
  } catch (error) {
    console.error('Admin db-backup DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
