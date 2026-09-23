export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkModuleAccess } from '@/lib/module-guard';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'themes');
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;

    const theme = await db.examTheme.findUnique({
      where: { id, organizationId: (access as any).orgId },
    });

    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
    }

    return NextResponse.json(theme);
  } catch (error) {
    console.error('Error fetching theme:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkModuleAccess(request, 'themes');
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;
    const body = await request.json();
    const { forceOverride, ...updateData } = body;

    const existingTheme = await db.examTheme.findUnique({
      where: { id, organizationId: (access as any).orgId },
    });

    if (!existingTheme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
    }

    if (existingTheme.status !== 'draft' && !forceOverride) {
      return NextResponse.json(
        { error: 'Cannot update non-draft theme without override' },
        { status: 400 }
      );
    }

    if (updateData.code && updateData.code !== existingTheme.code) {
      const codeExists = await db.examTheme.findFirst({
        where: { code: updateData.code, organizationId: (access as any).orgId },
      });
      if (codeExists) {
        return NextResponse.json({ error: 'Code must be unique' }, { status: 400 });
      }
    }

    const updatedTheme = await db.examTheme.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, theme: updatedTheme });
  } catch (error) {
    console.error('Error updating theme:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
      include: { tests: true },
    });

    if (!existingTheme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
    }

    if (existingTheme.tests && existingTheme.tests.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete theme because it is referenced by tests' },
        { status: 400 }
      );
    }

    await db.examTheme.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting theme:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

