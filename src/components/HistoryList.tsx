import React, { useState, useRef } from 'react';
import {
  History,
  Play,
  Pause,
  Download,
  Trash2,
  Clock,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { GeneratedAudioItem } from '../types';
import { triggerAudioDownload } from '../utils/audio';

interface HistoryListProps {
  history: GeneratedAudioItem[];
  currentAudioId?: string;
  onSelectAudio: (audio: GeneratedAudioItem) => void;
  onDeleteAudio: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  currentAudioId,
  onSelectAudio,
  onDeleteAudio,
  onClearHistory,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleInlinePlay = (e: React.MouseEvent, item: GeneratedAudioItem) => {
    e.stopPropagation();

    if (playingId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    audioRef.current.src = item.audioUrl;
    audioRef.current.playbackRate = item.speed || 1.0;
    audioRef.current.onended = () => setPlayingId(null);
    audioRef.current.onerror = () => setPlayingId(null);
    audioRef.current.play().then(() => {
      setPlayingId(item.id);
    });
  };

  const handleDownload = (e: React.MouseEvent, item: GeneratedAudioItem) => {
    e.stopPropagation();
    const filename = `voiceover-${item.voiceName.toLowerCase()}-${item.id.slice(0, 8)}.wav`;
    triggerAudioDownload(item.audioUrl, filename);
  };

  const formatTimestamp = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 text-center transition-all">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center mb-3">
          <History className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Session History Yet
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Generated voiceovers in this session will appear here with instant replay and WAV download options.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Session Generation History ({history.length})
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Saved in current session • Click any voiceover to load into player
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
        >
          Clear History
        </button>
      </div>

      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {history.map((item) => {
          const isSelected = item.id === currentAudioId;
          const isPlaying = item.id === playingId;

          return (
            <div
              key={item.id}
              onClick={() => onSelectAudio(item)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left ${
                isSelected
                  ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/20'
                  : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60'
              }`}
            >
              {/* Left: Play button & info */}
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={(e) => toggleInlinePlay(e, item)}
                  className={`p-2.5 rounded-xl flex-shrink-0 transition active:scale-95 ${
                    isPlaying
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs'
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {item.voiceName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.language}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-lg">
                    {item.text}
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, item)}
                  title="Download WAV"
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAudio(item.id);
                  }}
                  title="Delete from history"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
