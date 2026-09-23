import { NextResponse } from 'next/server'

// GET - List student's certificates
export async function GET() {
  // Certificate model does not exist in schema
  return NextResponse.json({ certificates: [] })
}

// POST - Generate certificate for completed course
export async function POST(req: Request) {
  // Certificate model does not exist in schema
  return NextResponse.json({ error: 'Certificates feature is currently disabled' }, { status: 501 })
}
