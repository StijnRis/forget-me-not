import 'server-only';

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export function getElevenLabsApiKey(): string | null {
  return process.env.ELEVENLABS_API_KEY?.trim() || null;
}

export function getElevenLabsVoiceId() {
  return process.env.ELEVENLABS_VOICE_ID?.trim() || '21m00Tcm4TlvDq8ikWAM';
}

export function createElevenLabsClient() {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    return null;
  }
  return new ElevenLabsClient({ apiKey });
}
