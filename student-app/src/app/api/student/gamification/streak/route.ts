import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthStudent } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  try {
    const { auth, student, error } = await getAuthStudent(req)
    if (error || !student || !auth) return NextResponse.json({ success: false, message: error }, { status: 401 })

    let streak = await db.streak.findUnique({ where: { studentId: student.id } })

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    if (!streak) {
      streak = await db.streak.create({
        data: {
          studentId: student.id,
          currentStreak: 1,
          longestStreak: 1,
          lastLoginAt: now
        }
      })
    } else {
      const lastLogin = new Date(streak.lastLoginAt)
      const lastLoginDay = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate())
      
      const diffTime = Math.abs(today.getTime() - lastLoginDay.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let newCurrent = streak.currentStreak
      let newLongest = streak.longestStreak

      if (diffDays === 1) {
        // Logged in consecutive day
        newCurrent += 1
        if (newCurrent > newLongest) newLongest = newCurrent
      } else if (diffDays > 1) {
        // Streak broken
        newCurrent = 1
      }
      
      // If diffDays === 0, it means they already logged in today, do nothing to the streak but update lastLoginAt

      streak = await db.streak.update({
        where: { id: streak.id },
        data: {
          currentStreak: newCurrent,
          longestStreak: newLongest,
          lastLoginAt: now
        }
      })
    }

    return NextResponse.json({ success: true, data: streak })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
