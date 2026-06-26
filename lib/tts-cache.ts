import 'server-only';

import { createHash } from 'crypto';
import { getRedis } from '@/lib/redis';

const TTS_MODEL_ID = 'eleven_flash_v2_5';
const TTS_OUTPUT_FORMAT = 'mp3_44100_128';
const TTS_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;

export type TtsAlignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

export type TtsCachePayload = {
  audio: string;
  alignment: TtsAlignment;
};

function buildTtsCacheKey(voiceId: string, text: string): string {
  const hash = createHash('sha256')
    .update(
      `${voiceId}:${TTS_MODEL_ID}:${TTS_OUTPUT_FORMAT}:${text.trim()}`
    )
    .digest('hex');

  return `tts:${hash}`;
}

export async function getCachedTts(
  voiceId: string,
  text: string
): Promise<TtsCachePayload | null> {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  try {
    return await redis.get<TtsCachePayload>(buildTtsCacheKey(voiceId, text));
  } catch (error) {
    console.log('[TTS cache] read failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function setCachedTts(
  voiceId: string,
  text: string,
  payload: TtsCachePayload
): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    return;
  }

  try {
    await redis.set(buildTtsCacheKey(voiceId, text), payload, {
      ex: TTS_CACHE_TTL_SECONDS,
    });
  } catch (error) {
    console.log('[TTS cache] write failed', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
