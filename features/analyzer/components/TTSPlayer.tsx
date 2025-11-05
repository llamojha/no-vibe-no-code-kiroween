'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Analysis } from '@/lib/types';
import { useLocale } from '@/features/locale/context/LocaleContext';
import { requestSpeech } from '@/features/analyzer/api/generateSpeech';
import { generateReport } from '@/features/analyzer/utils/exportReport';
import {
  decodeBase64,
  decodePcmToAudioBuffer,
  tryDecodeWithAudioContext,
} from '@/features/analyzer/utils/audio';
import { capture } from '@/features/analytics/posthogClient';

interface TTSPlayerProps {
  analysis: Analysis;
  initialAudioBase64?: string | null;
  onAudioGenerated?: (audioBase64: string) => void;
}

type PlayerStatus = 'idle' | 'generating' | 'playing' | 'paused' | 'error';

const TTSPlayer: React.FC<TTSPlayerProps> = ({ analysis, initialAudioBase64, onAudioGenerated }) => {
  const { locale, t } = useLocale();
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [loadedAudioBase64, setLoadedAudioBase64] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);

  useEffect(() => {
    return () => {
      sourceNodeRef.current?.stop();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    // Defer decoding until user presses Play to satisfy mobile restrictions
    if (!initialAudioBase64) {
      setAudioBuffer(null);
      setLoadedAudioBase64(null);
      setStatus((current) => (current === 'generating' ? 'idle' : current));
      return;
    }
    if (loadedAudioBase64 !== initialAudioBase64) {
      // New recording arrived: stop any current playback and clear old buffer
      try {
        if (sourceNodeRef.current) {
          sourceNodeRef.current.onended = null;
          sourceNodeRef.current.stop();
        }
      } catch {}
      pausedAtRef.current = 0;
      setStatus('idle');
      setAudioBuffer(null);
      setLoadedAudioBase64(initialAudioBase64);
    }
  }, [initialAudioBase64, loadedAudioBase64]);

  const ensureAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      const Ctx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      try {
        audioContextRef.current = new Ctx();
      } catch (e) {
        console.error('Failed to create AudioContext', e);
        return;
      }
    }
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (resumeError) {
        console.error('Failed to resume audio context', resumeError);
      }
    }
  }, []);

  const playFrom = useCallback(
    (offset: number, bufferOverride?: AudioBuffer) => {
      const bufferToUse = bufferOverride ?? audioBuffer;
      if (!bufferToUse || !audioContextRef.current) return;

      sourceNodeRef.current?.stop();
      const source = audioContextRef.current.createBufferSource();
      source.buffer = bufferToUse;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        setStatus((current) => (current === 'playing' ? 'idle' : current));
        pausedAtRef.current = 0;
      };
      source.start(0, offset);
      sourceNodeRef.current = source;
      startTimeRef.current = audioContextRef.current.currentTime - offset;
      setStatus('playing');
    },
    [audioBuffer],
  );

  const handleGenerate = useCallback(async () => {
    if (status === 'generating' || audioBuffer) return;

    await ensureAudioContext();

    setStatus('generating');
    try {
      const reportText = generateReport(analysis, locale, 'txt', {
        forTts: true,
      });
      const base64Audio = await requestSpeech(reportText, locale);
      if (!audioContextRef.current) throw new Error('Audio context missing');

      // First try browser-native decode (handles WAV/MP3/OGG); fall back to raw PCM
      const bytes = decodeBase64(base64Audio);
      let buffer =
        (await tryDecodeWithAudioContext(bytes, audioContextRef.current)) ??
        (await decodePcmToAudioBuffer(bytes, audioContextRef.current, 24000, 1));
      setAudioBuffer(buffer);
      setLoadedAudioBase64(base64Audio);
      onAudioGenerated?.(base64Audio);
      capture('tts_generated', { locale, length_chars: reportText.length });
    } catch (error) {
      console.error('Error generating audio:', error);
      setStatus('error');
      setAudioBuffer(null);
      setLoadedAudioBase64(null);
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [analysis, audioBuffer, ensureAudioContext, locale, onAudioGenerated, status]);

  useEffect(() => {
    if (status === 'generating' && audioBuffer) {
      playFrom(0);
    }
  }, [status, audioBuffer, playFrom]);

  const handlePlay = useCallback(async () => {
    if (status === 'playing') return;

    await ensureAudioContext();

    let bufferToUse = audioBuffer;

    // If no decoded buffer yet but we have stored base64, decode on-demand
    if (!bufferToUse && loadedAudioBase64 && audioContextRef.current) {
      try {
        const bytes = decodeBase64(loadedAudioBase64);
        const decoded =
          (await tryDecodeWithAudioContext(bytes, audioContextRef.current)) ??
          (await decodePcmToAudioBuffer(bytes, audioContextRef.current, 24000, 1));
        setAudioBuffer(decoded);
        bufferToUse = decoded;
      } catch (err) {
        console.error('Failed to decode stored audio on play', err);
        return;
      }
    }

    if (!bufferToUse) return; // decoding failed or not available

    if (status === 'paused') {
      playFrom(pausedAtRef.current, bufferToUse);
    } else {
      pausedAtRef.current = 0;
      playFrom(0, bufferToUse);
    }
  }, [audioBuffer, ensureAudioContext, loadedAudioBase64, playFrom, status]);

  const handlePause = useCallback(() => {
    if (status !== 'playing' || !sourceNodeRef.current || !audioContextRef.current) return;

    sourceNodeRef.current.onended = null;
    sourceNodeRef.current.stop();
    pausedAtRef.current =
      audioContextRef.current.currentTime - startTimeRef.current;
    setStatus('paused');
  }, [status]);

  const handleStop = useCallback(() => {
    if (status !== 'playing' && status !== 'paused') return;

    if (sourceNodeRef.current) {
      sourceNodeRef.current.onended = null;
      sourceNodeRef.current.stop();
    }
    pausedAtRef.current = 0;
    setStatus('idle');
  }, [status]);

  // Consider saved-but-not-yet-decoded audio as generated so controls show up.
  const hasGenerated = audioBuffer !== null || loadedAudioBase64 !== null;

  const baseButtonClasses =
    'p-3 rounded-none transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-accent';
  const enabledButtonClasses =
    'bg-primary/50 hover:bg-accent/20 text-slate-200 hover:text-accent';
  const disabledButtonClasses = 'bg-primary/30 text-slate-600 cursor-not-allowed';

  const renderContent = () => {
    if (status === 'generating') {
      return (
        <div className="flex items-center text-slate-300 h-12 uppercase tracking-wider text-accent">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{t('generatingAudio')}</span>
        </div>
      );
    }

    if (!hasGenerated) {
      return (
        <button
          onClick={handleGenerate}
          className="px-6 py-3 text-sm font-medium uppercase tracking-wider text-white bg-secondary/80 rounded-none hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-secondary"
        >
          {t('generateAudioReportButton')}
        </button>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <button
          onClick={handlePlay}
          disabled={status === 'playing'}
          title={t('playReport')}
          className={`${baseButtonClasses} ${
            status === 'playing' ? disabledButtonClasses : enabledButtonClasses
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </button>
        <button
          onClick={handlePause}
          disabled={status !== 'playing'}
          title={t('pauseReport')}
          className={`${baseButtonClasses} ${
            status === 'playing' ? enabledButtonClasses : disabledButtonClasses
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M5.75 4.5a.75.75 0 00-.75.75v10a.75.75 0 001.5 0V5.25A.75.75 0 005.75 4.5zM14.25 4.5a.75.75 0 00-.75.75v10a.75.75 0 001.5 0V5.25a.75.75 0 00-.75-.75z" />
          </svg>
        </button>
        <button
          onClick={handleStop}
          disabled={status !== 'playing' && status !== 'paused'}
          title={t('stopReport')}
          className={`${baseButtonClasses} ${
            status === 'playing' || status === 'paused'
              ? enabledButtonClasses
              : disabledButtonClasses
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M5 5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H5z" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="flex justify-center items-center gap-4 mb-6 animate-slide-in-up p-4 bg-primary/50 rounded-none shadow-lg border border-slate-700">
      {renderContent()}
    </div>
  );
};

export default TTSPlayer;
