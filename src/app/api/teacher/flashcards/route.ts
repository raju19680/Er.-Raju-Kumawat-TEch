export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthTeacher } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const { auth, teacher, error, status } = await getAuthTeacher(req)
    if (error || !teacher || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const { title, description, courseId, cards } = await req.json()

    if (!title) {
      return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 })
    }

    const deck = await db.flashcardDeck.create({
      data: {
        title,
        description,
        courseId,
        organizationId: auth.orgId,
        flashcards: {
          create: cards?.map((card: any, index: number) => ({
            front: card.front,
            back: card.back,
            sortOrder: index
          })) || []
        }
      },
      include: {
        flashcards: true
      }
    })

    return NextResponse.json({
      success: true,
      data: deck
    })
  } catch (error) {
    console.error('Teacher flashcard deck POST error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { auth, teacher, error, status } = await getAuthTeacher(req)
    if (error || !teacher || !auth) {
      return NextResponse.json({ success: false, message: error || 'Authentication required' }, { status: status || 401 })
    }

    const decks = await db.flashcardDeck.findMany({
      where: {
        organizationId: auth.orgId,
      },
      include: {
        _count: { select: { flashcards: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: decks
    })
  } catch (error) {
    console.error('Teacher flashcard GET error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

