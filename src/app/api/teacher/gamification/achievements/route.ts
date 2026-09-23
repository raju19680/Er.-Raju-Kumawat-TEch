export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthTeacher } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, teacher, error } = await getAuthTeacher(req)
    if (error || !teacher || !auth) return NextResponse.json({ success: false, message: error }, { status: 401 })

    // Seed some achievements if none exist (for demo purposes)
    const count = await db.achievement.count()
    if (count === 0) {
      await db.achievement.createMany({
        data: [
          { title: 'First Login', description: 'Logged into the portal for the first time.', criteria: 'login_1' },
          { title: 'Week Streak', description: 'Logged in for 7 consecutive days.', criteria: 'streak_7' },
          { title: 'First Assignment', description: 'Submitted your first assignment.', criteria: 'submit_1' },
          { title: 'Top Scorer', description: 'Got 100/100 on an assignment.', criteria: 'score_100' }
        ]
      })
    }

    const allAchievements = await db.achievement.findMany()
    
    return NextResponse.json({ success: true, data: allAchievements })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

