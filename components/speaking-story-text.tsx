'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  alignmentFromApi,
  processAlignments,
  type WordTiming,
} from '@/lib/tts-alignment';
import { Loader2 } from 'lucide-react';

type SpeakingStoryTextProps = {
  storyId: number;
  text: string;
  onLightBackground?: boolean;
  onProgress?: (progress: number) => void;
  onDuration?: (durationMs: number) => void;
  onComplete?: (durationMs: number) => void;
};

export function SpeakingStoryText({
  storyId,
  text,
  onLightBackground = true,
  onProgress,
  onDuration,
  onComplete,
}: SpeakingStoryTextProps) {
  const [words, setWords] = useState<WordTiming[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const onProgressRef = useRef(onProgress);
  const onDurationRef = useRef(onDuration);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onDurationRef.current = onDuration;
    onCompleteRef.current = onComplete;
  }, [onProgress, onDuration, onComplete]);

  useEffect(() => {
    completedRef.current = false;
    onProgressRef.current?.(0);
  }, [storyId, text]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadSpeech() {
      if (!text.trim()) {
        setWords([]);
        setAudioSrc(null);
        return;
      }

      setLoading(true);
      setError(null);
      setCurrentWordIndex(null);
      setWords([]);
      setAudioSrc(null);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            typeof data.error === 'string'
              ? data.error
              : `Speech generation failed (${response.status})`
          );
        }

        if (cancelled) return;

        const timings = processAlignments(alignmentFromApi(data.alignment));
        setWords(timings.length > 0 ? timings : fallbackWords(text));
        setAudioSrc(data.audio);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError('Could not read aloud. Showing text only.');
        setWords(fallbackWords(text));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSpeech();

    return () => {
      cancelled = true;
      controller.abort();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [storyId, text]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    const playAudio = async () => {
      try {
        await audio.play();
      } catch {
        // Autoplay may be blocked until user interaction
      }
    };

    playAudio();
  }, [audioSrc]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || words.length === 0) return;

    const notifyComplete = (durationMs: number) => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current?.(durationMs);
    };

    const handleLoadedMetadata = () => {
      const duration = audio.duration;
      if (duration > 0 && Number.isFinite(duration)) {
        onDurationRef.current?.(duration * 1000);
      }
    };

    const handleTimeUpdate = () => {
      const duration = audio.duration;
      if (duration > 0 && Number.isFinite(duration)) {
        onProgressRef.current?.(Math.min(audio.currentTime / duration, 1));
      }

      const currentTime = audio.currentTime;
      const index = words.findIndex(
        (w) => currentTime >= w.start && currentTime <= w.end + 0.05
      );

      if (index !== -1) {
        setCurrentWordIndex(index);
        wordRefs.current[index]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    };

    const handleEnded = () => {
      setCurrentWordIndex(null);
      const durationMs =
        audio.duration > 0 && Number.isFinite(audio.duration)
          ? audio.duration * 1000
          : 0;
      notifyComplete(durationMs);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    if (audio.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [words, audioSrc]);

  // No audio: advance progress on a gentle read-aloud pace
  useEffect(() => {
    if (audioSrc || loading || !text.trim()) return;

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const durationMs = Math.max(wordCount * 400, 8000);
    onDurationRef.current?.(durationMs);
    const startedAt = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(elapsed / durationMs, 1);
      onProgressRef.current?.(progress);
      if (progress >= 1) {
        clearInterval(interval);
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current?.(durationMs);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [audioSrc, loading, storyId, text]);

  const displayWords = words.length > 0 ? words : fallbackWords(text);

  return (
    <div className="relative">
      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} preload="auto" className="sr-only" />
      )}

      {loading && (
        <div
          className={cn(
            'flex items-center gap-2 text-lg mb-4',
            onLightBackground ? 'text-sky-700' : 'text-white/90'
          )}
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Reading story...</span>
        </div>
      )}

      {error && (
        <p
          className={cn(
            'text-sm mb-4',
            onLightBackground ? 'text-amber-700' : 'text-amber-200'
          )}
        >
          {error}
        </p>
      )}

      <div
        className={cn(
          'flex flex-wrap gap-x-1.5 gap-y-1 max-w-full text-2xl sm:text-3xl leading-relaxed break-words [overflow-wrap:anywhere]',
          onLightBackground ? 'text-gray-800' : 'text-white'
        )}
        aria-live="polite"
      >
        {displayWords.map((item, index) => (
          <span
            key={`${storyId}-${index}`}
            ref={(el) => {
              wordRefs.current[index] = el;
            }}
            className={cn(
              'rounded px-1 transition-colors duration-100',
              currentWordIndex === index &&
                'bg-amber-300 text-gray-900 font-bold shadow-sm'
            )}
          >
            {item.word}
          </span>
        ))}
      </div>
    </div>
  );
}

function fallbackWords(text: string): WordTiming[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ({ word, start: 0, end: 0 }));
}
