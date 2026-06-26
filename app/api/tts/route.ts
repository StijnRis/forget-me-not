import { NextResponse } from 'next/server';
import {
  createElevenLabsClient,
  getElevenLabsVoiceId,
} from '@/lib/elevenlabs';
import { getUser } from '@/lib/db/queries';
import { getCachedTts, setCachedTts } from '@/lib/tts-cache';

function logTtsError(label: string, details: unknown) {
  console.log(`[TTS] ${label}`, details);
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    logTtsError('unauthorized', { reason: 'No session user' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { text, voiceId } = await request.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      logTtsError('bad request', { reason: 'Missing or empty text' });
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const elevenlabs = createElevenLabsClient();
    if (!elevenlabs) {
      logTtsError('not configured (503)', {
        envKeyPresent: Boolean(process.env.ELEVENLABS_API_KEY?.trim()),
        hint: 'Add ELEVENLABS_API_KEY to .env in the project root, save the file, then restart the dev server.',
      });
      return NextResponse.json(
        { error: 'Text-to-speech is not configured' },
        { status: 503 }
      );
    }

    const selectedVoiceId =
      typeof voiceId === 'string' && voiceId.length > 0
        ? voiceId
        : getElevenLabsVoiceId();

    logTtsError('request', {
      voiceId: selectedVoiceId,
      textLength: text.trim().length,
    });

    const trimmedText = text.trim();
    const cached = await getCachedTts(selectedVoiceId, trimmedText);
    if (cached) {
      logTtsError('cache hit', {
        voiceId: selectedVoiceId,
        textLength: trimmedText.length,
      });
      return NextResponse.json(cached);
    }

    const responseData = await elevenlabs.textToSpeech.convertWithTimestamps(
      selectedVoiceId,
      {
        text: trimmedText,
        modelId: 'eleven_flash_v2_5',
        outputFormat: 'mp3_44100_128',
      }
    );

    const alignment =
      responseData.alignment ?? responseData.normalizedAlignment;

    if (!alignment) {
      logTtsError('no alignment', {
        hasAudio: Boolean(responseData.audioBase64),
        keys: Object.keys(responseData),
      });
      return NextResponse.json(
        { error: 'No alignment data returned' },
        { status: 500 }
      );
    }

    const payload = {
      audio: `data:audio/mpeg;base64,${responseData.audioBase64}`,
      alignment: {
        characters: alignment.characters,
        character_start_times_seconds: alignment.characterStartTimesSeconds,
        character_end_times_seconds: alignment.characterEndTimesSeconds,
      },
    };

    await setCachedTts(selectedVoiceId, trimmedText, payload);

    return NextResponse.json(payload);
  } catch (error) {
    logTtsError('ElevenLabs API error', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
      body:
        error && typeof error === 'object' && 'body' in error
          ? (error as { body?: unknown }).body
          : undefined,
      statusCode:
        error && typeof error === 'object' && 'statusCode' in error
          ? (error as { statusCode?: unknown }).statusCode
          : undefined,
    });
    return NextResponse.json(
      {
        error: 'Failed to generate speech with timing',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
