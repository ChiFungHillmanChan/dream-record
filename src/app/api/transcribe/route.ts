import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/app/services/openai';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const audioFile = formData.get('audio') as File | null;

  if (!audioFile) {
    return NextResponse.json(
      { error: 'No audio file provided' },
      { status: 400 }
    );
  }

  const openai = getOpenAI();
  
  // Convert File to the format OpenAI expects
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'zh', // Chinese - Whisper will handle Cantonese as Chinese
    response_format: 'text',
  });

  return NextResponse.json({ 
    success: true, 
    text: transcription 
  });
}

