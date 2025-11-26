import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getOpenAI } from '@/app/services/openai';
import { loadPromptFile } from '@/app/services/load-prompts';
import { PLANS, FREE_ANALYSIS_LIMIT, ROLES } from '@/lib/constants';

/**
 * Check and update user plan based on expiration date
 */
async function checkAndUpdatePlanExpiration(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true }
  });

  if (!user) return PLANS.FREE;

  if (user.plan === PLANS.DEEP && user.planExpiresAt) {
    const now = new Date();
    if (user.planExpiresAt < now) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: PLANS.FREE,
          planExpiresAt: null
        }
      });
      return PLANS.FREE;
    }
  }

  return user.plan;
}

// POST /api/analysis - Analyze a dream
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json(
      { error: '請先登入' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { content } = body;

  if (!content) {
    return NextResponse.json(
      { error: 'Missing dream content' },
      { status: 400 }
    );
  }

  // Check and update plan expiration first
  const effectivePlan = await checkAndUpdatePlanExpiration(session.userId as string);

  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: {
      plan: true,
      role: true,
      lifetimeAnalysisCount: true,
      id: true
    }
  });

  if (!user) {
    return NextResponse.json(
      { error: '找不到用戶' },
      { status: 404 }
    );
  }

  const isPremium = effectivePlan === PLANS.DEEP || user.role === ROLES.SUPERADMIN;

  // Lifetime limit check for FREE users only
  if (!isPremium && user.lifetimeAnalysisCount >= FREE_ANALYSIS_LIMIT) {
    return NextResponse.json(
      { error: `免費版的 ${FREE_ANALYSIS_LIMIT} 次 AI 解析已用完。升級深度版享無限解析！` },
      { status: 403 }
    );
  }

  const openai = getOpenAI();
  if (!openai) {
    return NextResponse.json(
      { error: 'AI 服務暫時無法使用' },
      { status: 503 }
    );
  }

  const promptText = await loadPromptFile('dream-analysis.txt');

  const response = await openai.responses.create({
    model: 'gpt-4.1',
    input: [
      {
        type: 'message',
        role: 'system',
        content: [{ type: 'input_text', text: promptText }]
      },
      {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: `Analyze this dream: "${content}"` }]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'dream_analysis',
        schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            analysis: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' }
                },
                required: ['title', 'content'],
                additionalProperties: false
              }
            },
            vibe: { type: 'string' },
            reflection: { type: 'string' }
          },
          required: ['summary', 'analysis', 'vibe', 'reflection'],
          additionalProperties: false
        },
        strict: true
      }
    }
  });

  if (response.status === 'completed') {
    const outputMessage = response.output.find(item => item.type === 'message');
    const textContent = outputMessage?.content?.find(item => item.type === 'output_text')?.text;
    if (textContent) {
      const result = JSON.parse(textContent);

      // Increment lifetime count for FREE users only
      if (!isPremium) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lifetimeAnalysisCount: { increment: 1 }
          }
        });
      }

      // For FREE users, redact deep analysis
      if (!isPremium) {
        return NextResponse.json({
          success: true,
          result: {
            ...result,
            analysis: null,
            reflection: null
          }
        });
      }

      return NextResponse.json({
        success: true,
        result
      });
    }
  }

  return NextResponse.json(
    { error: 'AI 分析失敗，請稍後再試' },
    { status: 500 }
  );
}

