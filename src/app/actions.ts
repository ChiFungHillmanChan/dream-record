'use server';

import { prisma } from '@/lib/prisma';
import { Dream, WeeklyReport } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getOpenAI } from '@/app/services/openai';
import { loadPromptFile } from '@/app/services/load-prompts';
import { getSession } from '@/lib/auth';
import { PLANS, FREE_ANALYSIS_LIMIT, FREE_WEEKLY_REPORT_LIMIT, ROLES } from '@/lib/constants';

// User info type for header display
export type CurrentUserInfo = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  plan: string;
  planExpiresAt: Date | null;
  lifetimeAnalysisCount: number;
} | null;

/**
 * Check and update user plan based on expiration date
 * Returns the effective plan (may differ from stored if expired)
 */
async function checkAndUpdatePlanExpiration(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true }
  });

  if (!user) return PLANS.FREE;

  // If user has DEEP plan and planExpiresAt has passed, revert to FREE
  if (user.plan === PLANS.DEEP && user.planExpiresAt) {
    const now = new Date();
    if (user.planExpiresAt < now) {
      // Plan has expired - revert to FREE
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

// Get current user info for header display
export async function getCurrentUser(): Promise<CurrentUserInfo> {
  const session = await getSession();
  if (!session?.userId) return null;

  // First check and update plan expiration
  await checkAndUpdatePlanExpiration(session.userId as string);

  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plan: true,
      planExpiresAt: true,
      lifetimeAnalysisCount: true,
    },
  });

  return user as CurrentUserInfo;
}

export type DreamData = {
  content: string;
  type: 'dream' | 'no_dream';
  date: string;
  tags: string[];
  id?: string;
  analysis?: string;
};

export type DreamAnalysisResult = {
  analysis: string | null;
  vibe: string;
  reflection: string | null;
  summary: string;
};

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

export async function getDreams(): Promise<Dream[]> {
  try {
    const session = await getSession();
    if (!session?.userId) return [];

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
      return dreams.map(d => ({
        ...d,
        analysis: redactAnalysis(d.analysis)
      }));
    }

    return dreams;
  } catch (error) {
    console.error("Error fetching dreams:", error);
    return [];
  }
}

export async function saveDream(data: DreamData): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.userId) return { success: false, error: 'Not authenticated' };

    const { id, tags, analysis, ...rest } = data;
    const tagsJson = JSON.stringify(tags);

    // If saving a real dream, automatically remove any 'no_dream' entries for the same day
    if (data.type === 'dream') {
      await prisma.dream.deleteMany({
        where: {
          userId: session.userId as string,
          date: data.date,
          type: 'no_dream',
        },
      });
    }

    // If saving a 'no_dream' entry, check if one already exists for today
    if (data.type === 'no_dream' && !id) {
      const existingNoDream = await prisma.dream.findFirst({
        where: {
          userId: session.userId as string,
          date: data.date,
          type: 'no_dream',
        },
      });
      if (existingNoDream) {
        return { success: false, error: '今日已經記錄咗冇發夢喇' };
      }
    }

    if (id) {
      // Verify ownership
      const existing = await prisma.dream.findUnique({ where: { id } });
      if (!existing || existing.userId !== session.userId) {
         return { success: false, error: 'Dream not found or unauthorized' };
      }

      await prisma.dream.update({
        where: { id },
        data: {
          ...rest,
          tags: tagsJson,
          ...(analysis !== undefined && { analysis }),
        },
      });
    } else {
      await prisma.dream.create({
        data: {
          ...rest,
          tags: tagsJson,
          analysis: analysis || null,
          userId: session.userId as string,
        },
      });
    }
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error saving dream:", error);
    return { success: false, error: 'Failed to save dream' };
  }
}

export async function deleteDream(id: string): Promise<{ success: boolean }> {
  try {
    const session = await getSession();
    if (!session?.userId) return { success: false };

    // Verify ownership
    const existing = await prisma.dream.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.userId) {
        return { success: false };
    }

    await prisma.dream.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error deleting dream:", error);
    return { success: false };
  }
}

export async function analyzeDream(content: string): Promise<{ result: DreamAnalysisResult | null; error?: string }> {
  const session = await getSession();
  if (!session?.userId) return { result: null, error: '請先登入' };

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

  if (!user) return { result: null, error: '找不到用戶' };

  // SUPERADMIN is treated as permanent DEEP user
  const isPremium = effectivePlan === PLANS.DEEP || user.role === ROLES.SUPERADMIN;

  // Lifetime limit check for FREE users only (SUPERADMIN bypasses this)
  if (!isPremium && user.lifetimeAnalysisCount >= FREE_ANALYSIS_LIMIT) {
    return { 
      result: null, 
      error: `免費版的 ${FREE_ANALYSIS_LIMIT} 次 AI 解析已用完。升級深度版享無限解析！` 
    };
  }

  const openai = getOpenAI();
  if (!openai) return { result: null, error: 'AI 服務暫時無法使用' };

  try {
    const promptText = await loadPromptFile('dream-analysis.txt');
    
    const response = await openai.responses.create({
      model: 'gpt-5.1',
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
        verbosity: 'medium',
        format: {
          type: 'json_schema',
          name: 'dream_analysis',
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              analysis: { type: 'string' },
              vibe: { type: 'string' },
              reflection: { type: 'string' }
            },
            required: ['summary', 'analysis', 'vibe', 'reflection'],
            additionalProperties: false
          },
          strict: true
        }
      },
      reasoning: {
        effort: 'medium'
      }
    });

    if (response.status === 'completed') {
        const outputMessage = response.output.find(item => item.type === 'message');
        const textContent = outputMessage?.content?.find(item => item.type === 'output_text')?.text;
        if (textContent) {
            const result = JSON.parse(textContent);
            
            // Increment lifetime count for FREE users only (SUPERADMIN bypasses)
            if (!isPremium) {
              await prisma.user.update({
                where: { id: user.id },
                data: { 
                  lifetimeAnalysisCount: { increment: 1 }
                }
              });
            }

            // For FREE users, redact deep analysis (SUPERADMIN gets full access)
            if (!isPremium) {
                return {
                    result: {
                      ...result,
                      analysis: null,
                      reflection: null
                    }
                };
            }
            
            return { result };
        }
    }
    return { result: null, error: 'AI 分析失敗，請稍後再試' };

  } catch (error) {
    console.error("AI Analysis failed:", error);
    return { result: null, error: '系統發生錯誤' };
  }
}

export type WeeklyReportData = {
  word_of_the_week: string;
  summary: string;
  themes: { name: string; description: string }[];
  emotional_trajectory: string;
  day_residue_analysis: string;
  archetypes: { name: string; explanation: string }[];
  deep_insight: string;
  advice: string;
  reflection_question: string;
  image_prompt: string;
};

// Helper function to get current week boundaries (Sunday to Saturday)
function getCurrentWeekBoundaries(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Get Sunday of current week (start)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  
  // Get Saturday of current week (end)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { weekStart, weekEnd };
}

// Weekly report limits configuration
// FREE: 3 lifetime reports, 5 days required per report
// DEEP/SUPERADMIN: 2 per week (unlimited weeks), 3 days required
const WEEKLY_REPORT_CONFIG = {
  FREE: {
    minDaysRequired: 5,
  },
  DEEP: {
    maxReportsPerWeek: 2,
    minDaysRequired: 3,
  },
} as const;

export async function generateWeeklyReport(): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.userId) return { success: false, error: '請先登入' };

  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { id: true, plan: true, role: true, lifetimeWeeklyReportCount: true }
  });

  if (!user) return { success: false, error: '找不到用戶' };

  // Determine if user has premium access (DEEP plan or SUPERADMIN)
  const isPremium = user.plan === PLANS.DEEP || user.role === ROLES.SUPERADMIN;

  // Get current week boundaries (Sunday to Saturday)
  const { weekStart, weekEnd } = getCurrentWeekBoundaries();

  // Check report limits
  if (isPremium) {
    // DEEP/SUPERADMIN: 2 reports per week
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
      return { 
        success: false, 
        error: `本週已生成 ${WEEKLY_REPORT_CONFIG.DEEP.maxReportsPerWeek} 份週報，下週日可再生成`
      };
    }
  } else {
    // FREE: 3 lifetime reports
    if (user.lifetimeWeeklyReportCount >= FREE_WEEKLY_REPORT_LIMIT) {
      return { 
        success: false, 
        error: `免費版的 ${FREE_WEEKLY_REPORT_LIMIT} 次週報已用完。升級深度版享每週生成！`
      };
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

  // Count unique days with dream records
  const uniqueDays = new Set(dreams.map(d => d.date)).size;
  const minDaysRequired = isPremium 
    ? WEEKLY_REPORT_CONFIG.DEEP.minDaysRequired 
    : WEEKLY_REPORT_CONFIG.FREE.minDaysRequired;

  if (uniqueDays < minDaysRequired) {
    return { 
      success: false, 
      error: isPremium
        ? `本週需要至少 ${minDaysRequired} 天的夢境記錄才能生成週報 (目前 ${uniqueDays} 天)`
        : `免費版需要至少 ${minDaysRequired} 天的夢境記錄才能生成週報 (目前 ${uniqueDays} 天)。升級深度版只需 ${WEEKLY_REPORT_CONFIG.DEEP.minDaysRequired} 天！`
    };
  }

  // Use week boundaries for the report
  const startDate = weekStart;
  const endDate = weekEnd;

  const dreamsText = dreams.map(d => `[${d.date}]: ${d.content} (Tags: ${d.tags})`).join('\n');

  const openai = getOpenAI();
  if (!openai) return { success: false, error: 'AI 服務暫時無法使用' };

  try {
    const promptText = await loadPromptFile('weekly-dream-analysis.txt');
    
    // 1. Text Analysis
    const response = await openai.responses.create({
      model: 'gpt-5.1',
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
                        description: { type: 'string' }
                    },
                    required: ['name', 'description'],
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
              image_prompt: { type: 'string' }
            },
            required: [
              'word_of_the_week', 'summary', 'themes', 'emotional_trajectory', 
              'day_residue_analysis', 'archetypes', 'deep_insight', 'advice', 
              'reflection_question', 'image_prompt'
            ],
            additionalProperties: false
          },
          strict: true
        }
      },
      reasoning: {
        effort: 'high'
      }
    });

    if (response.status !== 'completed') {
         return { success: false, error: 'AI 分析失敗' };
    }

    const outputMessage = response.output.find(item => item.type === 'message');
    const textContent = outputMessage?.content?.find(item => item.type === 'output_text')?.text;

    if (!textContent) {
        return { success: false, error: 'AI 未返回分析結果' };
    }

    const analysisData: WeeklyReportData = JSON.parse(textContent);
    let imageBase64: string | null = null;

    // 2. Image Generation (only if prompt exists and user is paid plan)
    // Actually, user requirement: "for free user, only able to view a little. for paid, view full."
    // We generate everything, but filter in view. But image might be expensive.
    // For now, generate it.
    
    if (analysisData.image_prompt) {
       try {
          const imageResponse = await openai.responses.create({
            model: 'gpt-5',
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
    await prisma.weeklyReport.create({
        data: {
            userId: user.id,
            startDate,
            endDate,
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
    return { success: true };

  } catch (error) {
    console.error("Weekly Report Generation failed:", error);
    return { success: false, error: '系統發生錯誤' };
  }
}

export async function getWeeklyReports(): Promise<WeeklyReport[]> {
  const session = await getSession();
  if (!session?.userId) return [];

  return await prisma.weeklyReport.findMany({
    where: { userId: session.userId as string },
    orderBy: { createdAt: 'desc' }
  });
}

// Weekly report status for UI
export type WeeklyReportStatus = {
  reportsUsed: number;
  reportsLimit: number;
  daysRecorded: number;
  daysRequired: number;
  canGenerate: boolean;
  isPremium: boolean;
  isLifetimeLimit: boolean; // true for FREE (lifetime), false for DEEP (per week)
  weekStartDate: string;
  weekEndDate: string;
};

export async function getWeeklyReportStatus(): Promise<WeeklyReportStatus | null> {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { id: true, plan: true, role: true, lifetimeWeeklyReportCount: true }
  });

  if (!user) return null;

  const isPremium = user.plan === PLANS.DEEP || user.role === ROLES.SUPERADMIN;
  
  const { weekStart, weekEnd } = getCurrentWeekBoundaries();

  let reportsUsed: number;
  let reportsLimit: number;
  
  if (isPremium) {
    // DEEP/SUPERADMIN: 2 per week
    reportsUsed = await prisma.weeklyReport.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: weekStart,
          lte: weekEnd
        }
      }
    });
    reportsLimit = WEEKLY_REPORT_CONFIG.DEEP.maxReportsPerWeek;
  } else {
    // FREE: 3 lifetime
    reportsUsed = user.lifetimeWeeklyReportCount;
    reportsLimit = FREE_WEEKLY_REPORT_LIMIT;
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
    select: { date: true }
  });

  const daysRecorded = new Set(dreams.map(d => d.date)).size;
  const daysRequired = isPremium 
    ? WEEKLY_REPORT_CONFIG.DEEP.minDaysRequired 
    : WEEKLY_REPORT_CONFIG.FREE.minDaysRequired;
  const canGenerate = reportsUsed < reportsLimit && daysRecorded >= daysRequired;

  return {
    reportsUsed,
    reportsLimit,
    daysRecorded,
    daysRequired,
    canGenerate,
    isPremium,
    isLifetimeLimit: !isPremium,
    weekStartDate: weekStart.toISOString().split('T')[0],
    weekEndDate: weekEnd.toISOString().split('T')[0],
  };
}

// Type for dream with analysis
export type DreamWithAnalysis = Dream & {
  analysis: string | null;
};

// Get a single dream by ID
export async function getDreamById(id: string): Promise<DreamWithAnalysis | null> {
  const session = await getSession();
  if (!session?.userId) return null;

  const dream = await prisma.dream.findUnique({
    where: { id }
  });

  if (!dream || dream.userId !== session.userId) {
    return null;
  }

  return dream;
}

// Get remaining free analyses count
export async function getRemainingFreeAnalyses(): Promise<number> {
  const session = await getSession();
  if (!session?.userId) return 0;

  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { lifetimeAnalysisCount: true, plan: true, role: true }
  });

  if (!user) return 0;
  if (user.plan === PLANS.DEEP || user.role === ROLES.SUPERADMIN) return -1; // -1 means unlimited (DEEP users and SUPERADMIN)

  return Math.max(0, FREE_ANALYSIS_LIMIT - user.lifetimeAnalysisCount);
}

// Check if user has already recorded "no dream" for a specific date
export async function hasNoDreamForDate(date: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.userId) return false;

  const existingNoDream = await prisma.dream.findFirst({
    where: {
      userId: session.userId as string,
      date: date,
      type: 'no_dream',
    },
  });

  return !!existingNoDream;
}
