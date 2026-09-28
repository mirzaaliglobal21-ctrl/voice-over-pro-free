import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Repeat,
  Sparkles,
  Music2,
  Check,
} from 'lucide-react';
import { GeneratedAudioItem } from '../types';
import { formatDuration, triggerAudioDownload, renderTunedAudioWav } from '../utils/audio';

interface AudioPlayerProps {
  currentAudio: GeneratedAudioItem;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ currentAudio }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(currentAudio.speed || 1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Sync audio source when currentAudio changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = currentAudio.audioUrl;
      audioRef.current.load();
      setIsPlaying(false);
      setCurrentTime(0);
      setPlaybackRate(currentAudio.speed || 1.0);
    }
  }, [currentAudio.id, currentAudio.audioUrl]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => console.error('Play error', e));
    }
  };

  // Time update event
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Loaded metadata event
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      audioRef.current.playbackRate = playbackRate;
    }
  };

  // Ended event
  const handleEnded = () => {
    if (!isLooping) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  // Seek on progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const seekPercentage = Math.max(0, Math.min(1, clickX / width));
    const seekTime = seekPercentage * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Volume change
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      if (newVol > 0 && isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  // Playback rate
  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Download uncompressed studio WAV
  const handleDownloadOriginalWav = () => {
    const filename = `voiceover-${currentAudio.voiceName.toLowerCase()}-${Date.now()}.wav`;
    triggerAudioDownload(currentAudio.audioUrl, filename);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  // Download tuned WAV (with OfflineAudioContext applied speed)
  const handleDownloadTunedWav = async () => {
    try {
      setIsDownloading(true);
      const tunedBlob = await renderTunedAudioWav(currentAudio.audioBase64, playbackRate);
      const url = URL.createObjectURL(tunedBlob);
      const filename = `voiceover-${currentAudio.voiceName.toLowerCase()}-${playbackRate}x-${Date.now()}.wav`;
      triggerAudioDownload(url, filename);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Tuned download error, falling back to master WAV:', err);
      handleDownloadOriginalWav();
    } finally {
      setIsDownloading(false);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-indigo-500/20 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        loop={isLooping}
      />

      {/* Top Details Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
            <Music2 className={`w-6 h-6 ${isPlaying ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight">
                {currentAudio.voiceName} Voiceover
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                {currentAudio.language.toUpperCase()} • 24kHz Studio WAV
              </span>
            </div>
            <p className="text-xs text-indigo-200/70 line-clamp-1 max-w-md mt-0.5">
              "{currentAudio.text}"
            </p>
          </div>
        </div>

        {/* Action Buttons: Download WAV */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadOriginalWav}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-black/20 transition active:scale-95"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Download WAV</span>
              </>
            )}
          </button>

          {Math.abs(playbackRate - 1.0) > 0.02 && (
            <button
              type="button"
              onClick={handleDownloadTunedWav}
              disabled={isDownloading}
              title={`Download tuned at ${playbackRate}x speed`}
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-800/60 hover:bg-indigo-700/60 text-indigo-200 border border-indigo-400/30 transition active:scale-95"
            >
              <span>Download ({playbackRate}x)</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Audio Waveform Bar (Simulated Dynamic Spectrum) */}
      <div className="flex items-center justify-center gap-1 h-12 mb-4 px-2 bg-slate-950/40 rounded-xl border border-white/5 relative z-10">
        {Array.from({ length: 36 }).map((_, i) => {
          const active = isPlaying;
          const height = active
            ? Math.sin(i * 0.4 + currentTime * 8) * 16 + 20
            : ((i % 5) + 2) * 4;

          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                active
                  ? 'bg-gradient-to-t from-indigo-400 via-sky-300 to-purple-400'
                  : 'bg-indigo-300/20'
              }`}
              style={{ height: `${Math.max(6, Math.min(36, height))}px` }}
            />
          );
        })}
      </div>

      {/* Interactive Progress Bar */}
      <div className="space-y-1.5 mb-5 relative z-10">
        <div
          ref={progressBarRef}
          onClick={handleProgressClick}
          className="relative w-full h-3 bg-slate-800/80 rounded-full cursor-pointer group overflow-hidden"
        >
          {/* Progress fill */}
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 rounded-full relative transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Scrubber head indicator */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
          </div>
        </div>

        {/* Current Time / Total Duration */}
        <div className="flex items-center justify-between text-xs font-mono text-indigo-200/70">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Controls Row: Play, Skip, Loop, Volume, Speed */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1 relative z-10">
        {/* Playback & Reset */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 transition active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            title="Restart audio"
            className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-indigo-200 border border-white/5 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsLooping((prev) => !prev)}
            title={isLooping ? 'Disable loop' : 'Enable continuous loop'}
            className={`p-2.5 rounded-xl border transition ${
              isLooping
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-xs'
                : 'bg-slate-800/60 hover:bg-slate-700/60 text-indigo-200 border-white/5'
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Volume & Playback Rate Controls */}
        <div className="flex items-center gap-4">
          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 text-indigo-300 hover:text-white transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 sm:w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>

          {/* Quick Rate Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-white/5">
            {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => handleRateChange(rate)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold font-mono transition ${
                  Math.abs(playbackRate - rate) < 0.02
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-200/70 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
