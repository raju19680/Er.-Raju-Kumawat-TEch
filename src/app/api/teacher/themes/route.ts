export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkModuleAccess } from '@/lib/module-guard';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'themes');
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    const whereClause: Prisma.ExamThemeWhereInput = {
      organizationId: (access as any).orgId,
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      ...(status && { status }),
    };

    const [items, total] = await Promise.all([
      db.examTheme.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      db.examTheme.count({ where: whereClause }),
    ]);

    return NextResponse.json({ items, total, page, limit });
  } catch (error) {
    console.error('Error fetching themes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'themes');
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await request.json();
    const { name, code, ...rest } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (code) {
      const existing = await db.examTheme.findFirst({
        where: { code, organizationId: (access as any).orgId },
      });
      if (existing) {
        return NextResponse.json({ error: 'Code must be unique' }, { status: 400 });
      }
    }

    const theme = await db.examTheme.create({
      data: {
        name,
        code,
        ...rest,
        status: 'draft',
        version: 1,
        organizationId: (access as any).orgId,
      },
    });

    return NextResponse.json({ success: true, theme });
  } catch (error) {
    console.error('Error creating theme:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

