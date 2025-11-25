'use server';

import { prisma } from '@/lib/prisma';
import { Dream } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getOpenAI } from '@/app/services/openai';
import { loadPromptFile } from '@/app/services/load-prompts';
import { getSession } from '@/lib/auth';

export type DreamData = {
  content: string;
  type: 'dream' | 'no_dream';
  date: string;
  tags: string[];
  id?: string;
};

export type DreamAnalysisResult = {
  analysis: string;
  vibe: string;
  reflection: string;
  summary: string;
};

export async function getDreams(): Promise<Dream[]> {
  try {
    const session = await getSession();
    if (!session?.userId) return [];

    return await prisma.dream.findMany({
      where: { userId: session.userId as string },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error("Error fetching dreams:", error);
    return [];
  }
}

export async function saveDream(data: DreamData): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.userId) return { success: false, error: 'Not authenticated' };

    const { id, tags, ...rest } = data;
    const tagsJson = JSON.stringify(tags);

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
        },
      });
    } else {
      await prisma.dream.create({
        data: {
          ...rest,
          tags: tagsJson,
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

export async function analyzeDream(content: string): Promise<DreamAnalysisResult | null> {
  const openai = getOpenAI();
  if (!openai) return null;

  try {
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
              analysis: { type: 'string' },
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
            return result;
        }
    }
    return null;

  } catch (error) {
    console.error("AI Analysis failed:", error);
    return null;
  }
}
