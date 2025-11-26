import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { PLANS, ROLES } from '@/lib/constants';
import { revalidatePath } from 'next/cache';

// Helper to redact analysis for free users
function redactAnalysis(jsonStr: string | null): string | null {
  if (!jsonStr) return null;
  try {
    const data = JSON.parse(jsonStr);
    return JSON.stringify({
      ...data,
      analysis: null,
      reflection: null
    });
  } catch {
    return jsonStr;
  }
}

// GET /api/dreams - List all dreams for current user
export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { plan: true, role: true }
  });

  const dreams = await prisma.dream.findMany({
    where: { userId: session.userId as string },
    orderBy: { createdAt: 'desc' },
  });

  // DEEP users and SUPERADMIN get full analysis
  const isPremium = user?.plan === PLANS.DEEP || user?.role === ROLES.SUPERADMIN;
  if (!isPremium) {
    return NextResponse.json({
      success: true,
      dreams: dreams.map(d => ({
        ...d,
        analysis: redactAnalysis(d.analysis)
      }))
    });
  }

  return NextResponse.json({
    success: true,
    dreams
  });
}

// POST /api/dreams - Create a new dream
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { content, type, date, tags, analysis } = body;

  if (!content || !type || !date) {
    return NextResponse.json(
      { error: 'Missing required fields: content, type, date' },
      { status: 400 }
    );
  }

  const tagsJson = JSON.stringify(tags || []);

  // If saving a real dream, automatically remove any 'no_dream' entries for the same day
  if (type === 'dream') {
    await prisma.dream.deleteMany({
      where: {
        userId: session.userId as string,
        date: date,
        type: 'no_dream',
      },
    });
  }

  // If saving a 'no_dream' entry, check if one already exists for today
  if (type === 'no_dream') {
    const existingNoDream = await prisma.dream.findFirst({
      where: {
        userId: session.userId as string,
        date: date,
        type: 'no_dream',
      },
    });
    if (existingNoDream) {
      return NextResponse.json(
        { error: '今日已經記錄咗冇發夢喇' },
        { status: 409 }
      );
    }
  }

  const dream = await prisma.dream.create({
    data: {
      content,
      type,
      date,
      tags: tagsJson,
      analysis: analysis || null,
      userId: session.userId as string,
    },
  });

  revalidatePath('/');

  return NextResponse.json({
    success: true,
    dream
  });
}


