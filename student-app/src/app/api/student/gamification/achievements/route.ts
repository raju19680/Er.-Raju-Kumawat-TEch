import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const { auth, student, error } = await getAuthStudent(req)
    if (error || !student || !auth) return NextResponse.json({ success: false, message: error }, { status: 401 })

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
    const unlocked = await db.studentAchievement.findMany({
      where: { studentId: student.id }
    })
    
    // Auto-unlock logic can go here (e.g. check streak and unlock if needed)
    // For now, let's just mark 'First Login' as unlocked for everyone hitting this endpoint
    let firstLogin = allAchievements.find(a => a.criteria === 'login_1')
    if (firstLogin && !unlocked.some(u => u.achievementId === firstLogin.id)) {
      const newUnlock = await db.studentAchievement.create({
        data: { studentId: student.id, achievementId: firstLogin.id }
      })
      unlocked.push(newUnlock)
    }

    const result = allAchievements.map(a => {
      const isUnlocked = unlocked.some(u => u.achievementId === a.id)
      return {
        ...a,
        unlocked: isUnlocked,
        unlockedAt: isUnlocked ? unlocked.find(u => u.achievementId === a.id)?.unlockedAt : null
      }
    })

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
