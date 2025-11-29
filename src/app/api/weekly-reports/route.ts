import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getOpenAI } from '@/app/services/openai';
import { loadPromptFile } from '@/app/services/load-prompts';
import { PLANS, FREE_WEEKLY_REPORT_LIMIT, ROLES } from '@/lib/constants';
import { revalidatePath } from 'next/cache';

// Weekly report limits configuration
const WEEKLY_REPORT_CONFIG = {
  FREE: {
    minDaysRequired: 5,
  },
  DEEP: {
    maxReportsPerWeek: 2,
    minDaysRequired: 3,
  },
} as const;

// Helper function to get current week boundaries (Sunday to Saturday)
function getCurrentWeekBoundaries(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

// GET /api/weekly-reports - List all weekly reports
export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const reports = await prisma.weeklyReport.findMany({
    where: { userId: session.userId as string },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({
    success: true,
    reports
  });
}

// POST /api/weekly-reports - Generate a new weekly report
export async function POST() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json(
      { error: '請先登入' },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { id: true, plan: true, role: true, lifetimeWeeklyReportCount: true }
  });

  if (!user) {
    return NextResponse.json(
      { error: '找不到用戶' },
      { status: 404 }
    );
  }

  const isPremium = user.plan === PLANS.DEEP || user.role === ROLES.SUPERADMIN;
  const isSuperAdmin = user.role === ROLES.SUPERADMIN;
  const { weekStart, weekEnd } = getCurrentWeekBoundaries();

  // Check report limits
  // SUPERADMIN has unlimited weekly reports (no limit check)
  if (isSuperAdmin) {
    // No limit check for SUPERADMIN - they have unlimited access
  } else if (isPremium) {
    const reportsThisWeek = await prisma.weeklyReport.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: weekStart,
          lte: weekEnd
        }
      }
    });

    if (reportsThisWeek >= WEEKLY_REPORT_CONFIG.DEEP.maxReportsPerWeek) {
      return NextResponse.json(
        { error: `本週已生成 ${WEEKLY_REPORT_CONFIG.DEEP.maxReportsPerWeek} 份週報，下週日可再生成` },
        { status: 403 }
      );
    }
  } else {
    if (user.lifetimeWeeklyReportCount >= FREE_WEEKLY_REPORT_LIMIT) {
      return NextResponse.json(
        { error: `免費版的 ${FREE_WEEKLY_REPORT_LIMIT} 次週報已用完。升級深度版享每週生成！` },
        { status: 403 }
      );
    }
  }

  // Get dreams for the current week
  const dreams = await prisma.dream.findMany({
    where: {
      userId: user.id,
      createdAt: {
        gte: weekStart,
        lte: weekEnd
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  const uniqueDays = new Set(dreams.map(d => d.date)).size;
  const minDaysRequired = isPremium
    ? WEEKLY_REPORT_CONFIG.DEEP.minDaysRequired
    : WEEKLY_REPORT_CONFIG.FREE.minDaysRequired;

  if (uniqueDays < minDaysRequired) {
    return NextResponse.json(
      {
        error: isPremium
          ? `本週需要至少 ${minDaysRequired} 天的夢境記錄才能生成週報 (目前 ${uniqueDays} 天)`
          : `免費版需要至少 ${minDaysRequired} 天的夢境記錄才能生成週報 (目前 ${uniqueDays} 天)。升級深度版只需 ${WEEKLY_REPORT_CONFIG.DEEP.minDaysRequired} 天！`
      },
      { status: 400 }
    );
  }

  const dreamsText = dreams.map(d => `[${d.date}]: ${d.content} (Tags: ${d.tags})`).join('\n');

  const openai = getOpenAI();
  if (!openai) {
    return NextResponse.json(
      { error: 'AI 服務暫時無法使用' },
      { status: 503 }
    );
  }

  const promptText = await loadPromptFile('weekly-dream-analysis.txt');

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
        content: [{ type: 'input_text', text: `Here are my dreams from the past week:\n${dreamsText}` }]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'weekly_dream_analysis',
        schema: {
          type: 'object',
          properties: {
            word_of_the_week: { type: 'string' },
            summary: { type: 'string' },
            themes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  score: { type: 'number' }
                },
                required: ['name', 'description', 'score'],
                additionalProperties: false
              }
            },
            metrics: {
              type: 'object',
              properties: {
                sleepQualityIndex: { type: 'number' },
                nightmareRatio: { type: 'number' },
                recurringSymbolScore: { type: 'number' },
                awakeningArousalLevel: { type: 'number' },
                lucidDreamCount: { type: 'number' },
                emotionVolatility: { type: 'number' }
              },
              required: ['sleepQualityIndex', 'nightmareRatio', 'recurringSymbolScore', 'awakeningArousalLevel', 'lucidDreamCount', 'emotionVolatility'],
              additionalProperties: false
            },
            psychological_analysis: {
              type: 'object',
              properties: {
                perspective_1: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    content: { type: 'string' }
                  },
                  required: ['name', 'content'],
                  additionalProperties: false
                },
                perspective_2: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    content: { type: 'string' }
                  },
                  required: ['name', 'content'],
                  additionalProperties: false
                }
              },
              required: ['perspective_1', 'perspective_2'],
              additionalProperties: false
            },
            interventions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  technique: { type: 'string' },
                  steps: { type: 'string' },
                  duration: { type: 'string' }
                },
                required: ['title', 'technique', 'steps', 'duration'],
                additionalProperties: false
              }
            },
            emotional_trajectory: { type: 'string' },
            day_residue_analysis: { type: 'string' },
            archetypes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  explanation: { type: 'string' }
                },
                required: ['name', 'explanation'],
                additionalProperties: false
              }
            },
            deep_insight: { type: 'string' },
            advice: { type: 'string' },
            reflection_question: { type: 'string' },
            image_prompt: { type: 'string' },
            disclaimer: { type: 'string' },
            quality_check_status: { type: 'string' }
          },
          required: [
            'word_of_the_week', 'summary', 'themes', 'metrics', 'psychological_analysis',
            'emotional_trajectory', 'day_residue_analysis', 'archetypes', 'deep_insight',
            'interventions', 'advice', 'reflection_question', 'image_prompt', 'disclaimer', 'quality_check_status'
          ],
          additionalProperties: false
        },
        strict: true
      }
    }
  });

  if (response.status !== 'completed') {
    return NextResponse.json(
      { error: 'AI 分析失敗' },
      { status: 500 }
    );
  }

  const outputMessage = response.output.find(item => item.type === 'message');
  const textContent = outputMessage?.content?.find(item => item.type === 'output_text')?.text;

  if (!textContent) {
    return NextResponse.json(
      { error: 'AI 未返回分析結果' },
      { status: 500 }
    );
  }

  const analysisData = JSON.parse(textContent);
  let imageBase64: string | null = null;

  // Image generation (optional)
  if (analysisData.image_prompt) {
    try {
      const imageResponse = await openai.responses.create({
        model: 'gpt-4o',
        input: [
          {
            type: 'message',
            role: 'user',
            content: [
              { type: 'input_text', text: `Generate an abstract, surrealist collage representing this dream analysis: ${analysisData.image_prompt}` }
            ]
          }
        ],
        tools: [{ type: 'image_generation' }]
      });

      const imageData = imageResponse.output
        .filter((output) => output.type === "image_generation_call")
        .map((output) => output.result);

      if (imageData.length > 0) {
        imageBase64 = imageData[0];
      }
    } catch (imgError) {
      console.error("Image generation failed:", imgError);
    }
  }

  // Save to DB
  const report = await prisma.weeklyReport.create({
    data: {
      userId: user.id,
      startDate: weekStart,
      endDate: weekEnd,
      analysis: JSON.stringify(analysisData),
      imageBase64: imageBase64 || null
    }
  });

  // Increment lifetime count for FREE users
  if (!isPremium) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lifetimeWeeklyReportCount: { increment: 1 } }
    });
  }

  revalidatePath('/weekly-reports');

  return NextResponse.json({
    success: true,
    report
  });
}


