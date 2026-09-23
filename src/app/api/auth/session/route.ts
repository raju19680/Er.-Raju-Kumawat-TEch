import { NextResponse } from 'next/server'
import { getSession, ensureAdminExists } from '@/lib/auth'

export async function GET() {
  try {
    await ensureAdminExists()
    const user = await getSession()
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null })
  }
}
