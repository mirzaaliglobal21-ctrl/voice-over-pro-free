import React, { useState, useRef } from 'react';
import { Volume2, Play, Square, UserCheck, Loader2 } from 'lucide-react';
import { VoiceOption, LanguageCode } from '../types';
import { VOICES } from '../data/presets';

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  selectedLanguage: LanguageCode;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  selectedLanguage,
}) => {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const handlePreview = async (e: React.MouseEvent, voice: VoiceOption) => {
    e.stopPropagation();
    setPreviewError(null);

    if (playingVoiceId === voice.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      }
      setPlayingVoiceId(null);
      return;
    }

    try {
      setLoadingVoiceId(voice.id);
      const res = await fetch('/api/tts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceName: voice.id,
          language: selectedLanguage,
        }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error(`Preview request failed (${res.status})`);
      }
      setLoadingVoiceId(null);

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Preview failed');
      }

      if (data.audioUrl) {
        if (!audioPlayerRef.current) {
          audioPlayerRef.current = new Audio();
        }
        audioPlayerRef.current.src = data.audioUrl;
        audioPlayerRef.current.onended = () => {
          setPlayingVoiceId(null);
        };
        audioPlayerRef.current.onerror = () => {
          setPlayingVoiceId(null);
        };
        await audioPlayerRef.current.play();
        setPlayingVoiceId(voice.id);
      }
    } catch (err: any) {
      console.error('Failed to preview voice:', err);
      setLoadingVoiceId(null);
      setPlayingVoiceId(null);
      setPreviewError(err?.message || 'Preview audio load nahi ho saka.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Select Voice Persona ({VOICES.length} Studio Voices)
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Click a card to select, or press Preview to listen
            </p>
          </div>
        </div>
      </div>

      {/* Preview Error Banner */}
      {previewError && (
        <div className="mb-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
          <span>{previewError}</span>
          <button
            type="button"
            onClick={() => setPreviewError(null)}
            className="text-[11px] font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid of Voices: Clean 1 column or 2 columns based on container width */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {VOICES.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          const isPlaying = playingVoiceId === voice.id;
          const isLoading = loadingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice.id)}
              className={`relative cursor-pointer rounded-xl p-3 border transition-all text-left flex flex-col justify-between group ${
                isSelected
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/25 shadow-sm'
                  : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:bg-slate-100/50 dark:hover:bg-slate-900'
              }`}
            >
              <div>
                {/* Header row: Avatar + Full Name + Status + Preview Button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        voice.gender === 'female'
                          ? 'bg-pink-100 dark:bg-pink-950/70 text-pink-600 dark:text-pink-300'
                          : 'bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300'
                      }`}
                    >
                      {voice.name[0]}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {voice.name}
                      </span>
                      {isSelected && (
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Preview Button - Never truncates */}
                  <button
                    type="button"
                    onClick={(e) => handlePreview(e, voice)}
                    disabled={isLoading}
                    title={`Preview ${voice.name}'s voice`}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition active:scale-95 cursor-pointer ${
                      isPlaying
                        ? 'bg-rose-500 text-white shadow-xs animate-pulse'
                        : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 shadow-2xs'
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : isPlaying ? (
                      <>
                        <Square className="w-2.5 h-2.5 fill-current" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Preview</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Subtitle / Gender & Role */}
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      voice.gender === 'female'
                        ? 'bg-pink-100/80 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300'
                        : 'bg-blue-100/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {voice.gender === 'female' ? 'Female' : 'Male'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {voice.role}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {voice.description}
                </p>
              </div>

              {/* Tags at bottom */}
              <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                {voice.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/60 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
