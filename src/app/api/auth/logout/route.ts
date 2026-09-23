import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' })

  const cookieNames = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url',
    'next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
    'erkt_api_token',
  ]

  cookieNames.forEach((name) => {
    response.cookies.set(name, '', {
      path: '/',
      expires: new Date(0),
      maxAge: 0,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  })

  return response
}

export async function GET(req: NextRequest) {
  return POST(req)
}
