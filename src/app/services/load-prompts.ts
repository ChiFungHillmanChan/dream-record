'use server';

import fs from 'fs/promises';
import path from 'path';

export async function loadPromptFile(filename: string): Promise<string> {
  try {
    const promptPath = path.join(process.cwd(), 'prompts', filename);
    const content = await fs.readFile(promptPath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error loading prompt file ${filename}:`, error);
    // Return a safe default or rethrow depending on requirements. 
    // For now, returning empty string to avoid crashing, but logging the error.
    // In production, you might want to fallback to a hardcoded prompt or throw.
    return '';
  }
}

