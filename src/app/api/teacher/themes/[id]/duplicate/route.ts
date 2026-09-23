export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkModuleAccess } from '@/lib/module-guard';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'themes');
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;

    const existingTheme = await db.examTheme.findUnique({
      where: { id, organizationId: (access as any).orgId },
    });

    if (!existingTheme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
    }

    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      code: _code,
      ...themeData
    } = existingTheme as any;

    const duplicatedTheme = await db.examTheme.create({
      data: {
        ...themeData,
        name: `${themeData.name} (Copy)`,
        code: null,
        status: 'draft',
        version: 1,
      },
    });

    return NextResponse.json({ success: true, theme: duplicatedTheme });
  } catch (error) {
    console.error('Error duplicating theme:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

