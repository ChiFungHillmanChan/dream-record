import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// GET /api/dreams/[id] - Get a single dream by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const { id } = await params;

  const dream = await prisma.dream.findUnique({
    where: { id }
  });

  if (!dream || dream.userId !== session.userId) {
    return NextResponse.json(
      { error: 'Dream not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    dream
  });
}

// PUT /api/dreams/[id] - Update a dream
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const { content, type, date, tags, analysis } = body;

  // Verify ownership
  const existing = await prisma.dream.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.userId) {
    return NextResponse.json(
      { error: 'Dream not found or unauthorized' },
      { status: 404 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (content !== undefined) updateData.content = content;
  if (type !== undefined) updateData.type = type;
  if (date !== undefined) updateData.date = date;
  if (tags !== undefined) updateData.tags = JSON.stringify(tags);
  if (analysis !== undefined) updateData.analysis = analysis;

  const dream = await prisma.dream.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/');

  return NextResponse.json({
    success: true,
    dream
  });
}

// DELETE /api/dreams/[id] - Delete a dream
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.dream.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.userId) {
    return NextResponse.json(
      { error: 'Dream not found or unauthorized' },
      { status: 404 }
    );
  }

  await prisma.dream.delete({ where: { id } });

  revalidatePath('/');

  return NextResponse.json({
    success: true
  });
}


