import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
        const user = await verifyAuth(req);
    if (!user || user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch distinct types
    const typesRes = await prisma.question.findMany({
      select: { type: true },
      distinct: ['type'],
    });
    
    // Fetch distinct sections
    const sectionsRes = await prisma.question.findMany({
      select: { section: true },
      distinct: ['section'],
    });

    const types = typesRes.map(t => t.type).filter(Boolean);
    const sections = sectionsRes.map(s => s.section).filter(Boolean);

    return NextResponse.json({
      types,
      sections
    });
  } catch (error: any) {
    console.error('Error fetching question metadata:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch metadata' }, { status: 500 });
  }
}
