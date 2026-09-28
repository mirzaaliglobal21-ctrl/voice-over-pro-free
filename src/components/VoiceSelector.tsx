import React, { useState, useRef } from 'react';
import { Volume2, Play, Square, UserCheck, Sparkles, Loader2 } from 'lucide-react';
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
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const handlePreview = async (e: React.MouseEvent, voice: VoiceOption) => {
    e.stopPropagation();

    // If currently playing this voice, stop it
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

      const data = await res.json();
      setLoadingVoiceId(null);

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
    } catch (err) {
      console.error('Failed to preview voice:', err);
      setLoadingVoiceId(null);
      setPlayingVoiceId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all">
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
              Choose gender, cadence, and preview tone before generating
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Voices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {VOICES.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          const isPlaying = playingVoiceId === voice.id;
          const isLoading = loadingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice.id)}
              className={`relative cursor-pointer rounded-xl p-3.5 border transition-all text-left group ${
                isSelected
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60'
              }`}
            >
              {/* Header: Name & Gender Badge & Preview Button */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      voice.gender === 'female'
                        ? 'bg-pink-100 dark:bg-pink-950/70 text-pink-600 dark:text-pink-300'
                        : 'bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300'
                    }`}
                  >
                    {voice.name[0]}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {voice.name}
                      </span>
                      {isSelected && (
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        voice.gender === 'female'
                          ? 'text-pink-600 dark:text-pink-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {voice.gender === 'female' ? 'Female' : 'Male'} • {voice.role}
                    </span>
                  </div>
                </div>

                {/* Preview Button */}
                <button
                  type="button"
                  onClick={(e) => handlePreview(e, voice)}
                  disabled={isLoading}
                  title={`Preview ${voice.name}'s voice`}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition active:scale-95 ${
                    isPlaying
                      ? 'bg-rose-500 text-white shadow-xs animate-pulse'
                      : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 shadow-xs'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isPlaying ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>Preview</span>
                    </>
                  )}
                </button>
              </div>

              {/* Description */}
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {voice.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-2.5">
                {voice.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800"
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
