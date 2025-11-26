import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { PLANS, FREE_ANALYSIS_LIMIT, ROLES } from '@/lib/constants';

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
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      plan: true,
      planExpiresAt: true,
      lifetimeAnalysisCount: true,
      lifetimeWeeklyReportCount: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Calculate remaining analyses
  const isPremium = user.plan === PLANS.DEEP || user.role === ROLES.SUPERADMIN;
  const remainingAnalyses = isPremium ? -1 : Math.max(0, FREE_ANALYSIS_LIMIT - user.lifetimeAnalysisCount);

  return NextResponse.json({
    success: true,
    user: {
      ...user,
      remainingAnalyses,
    },
  });
}

