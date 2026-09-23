import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    await db.$executeRawUnsafe(`ALTER TABLE "TestSeries" ADD COLUMN IF NOT EXISTS "parentId" TEXT;`)
    await db.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'TestSeries_parentId_fkey'
        ) THEN
          ALTER TABLE "TestSeries" 
          ADD CONSTRAINT "TestSeries_parentId_fkey" 
          FOREIGN KEY ("parentId") REFERENCES "TestSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `)
    return NextResponse.json({ success: true, message: 'Migration successful!' })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
