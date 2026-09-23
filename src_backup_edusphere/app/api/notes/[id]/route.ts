import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET - Get notes content (for students who purchased)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notes = await db.notes.findUnique({
      where: { id },
      include: {
        teacher: {
          select: { id: true, name: true, username: true, avatar: true, organisationId: true },
        },
      },
    })

    if (!notes || !notes.isPublished) {
      return NextResponse.json({ error: 'Notes not found' }, { status: 404 })
    }

    // Check if student purchased (or it's free)
    let hasAccess = notes.price === 0
    if (!hasAccess) {
      const purchase = await db.notesPurchase.findUnique({
        where: { userId_notesId: { userId: session.id, notesId: id } },
      })
      hasAccess = !!purchase
    }

    return NextResponse.json({
      notes: {
        ...notes,
        content: hasAccess ? notes.content : '[Purchase these notes to access the full content]',
        hasAccess,
      },
    })
  } catch (error) {
    console.error('Get notes detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
