/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Wand2,
  AlertCircle,
  Loader2,
  Sparkles,
  Music,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { LanguageCode, GeneratedAudioItem } from './types';
import { Header } from './components/Header';
import { ScriptEditor } from './components/ScriptEditor';
import { VoiceSelector } from './components/VoiceSelector';
import { AudioControls } from './components/AudioControls';
import { AudioPlayer } from './components/AudioPlayer';
import { HistoryList } from './components/HistoryList';
import { HowItWorks } from './components/HowItWorks';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';

const STORAGE_KEY_HISTORY = 'voiceover_pro_history_v1';
const STORAGE_KEY_THEME = 'voiceover_pro_theme_v1';

export default function App() {
  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // App Generation State
  const [text, setText] = useState<string>(
    'خوش آمدید! وائس اوور پرو میں آپ کسی بھی متن کو اسٹوڈیو کوالٹی قدرتی آواز میں تبدیل کر سکتے ہیں۔'
  );
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('ur');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [style, setStyle] = useState<string>('');

  // Execution & Output State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<GeneratedAudioItem | null>(null);
  const [history, setHistory] = useState<GeneratedAudioItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const playerRef = useRef<HTMLDivElement | null>(null);
  const howItWorksRef = useRef<HTMLDivElement | null>(null);

  // Apply dark mode class to root HTML
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [darkMode]);

  // Persist history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn('LocalStorage save history error', e);
    }
  }, [history]);

  // Main Action: Generate Voice using Gemini TTS
  const handleGenerateVoice = async () => {
    setErrorMessage(null);

    // 1. Validation check
    if (!text || !text.trim()) {
      setErrorMessage('Text likhna zaroori hai! Barah-e-karam apna script darj karein.');
      return;
    }

    if (text.length > 5000) {
      setErrorMessage('Script 5,000 characters se zyada lamba nahi ho sakta.');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingStep('Connecting to Gemini TTS engine...');

      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          language: selectedLanguage,
          voiceName: selectedVoice,
          speed,
          pitch,
          style,
        }),
      });

      setLoadingStep('Synthesizing studio voice waves...');

      let data: any;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error(
          `Server response error (${response.status} ${response.statusText}). Server might be initializing.`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Voice generation error (${response.status}).`);
      }

      setLoadingStep('Formatting 24kHz WAV audio stream...');

      const newAudioItem: GeneratedAudioItem = {
        id: `audio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        text: text.trim(),
        language: selectedLanguage,
        voiceName: selectedVoice,
        speed,
        pitch,
        style,
        audioUrl: data.audioUrl,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
        createdAt: Date.now(),
      };

      setCurrentAudio(newAudioItem);
      setHistory((prev) => [newAudioItem, ...prev.slice(0, 19)]); // keep latest 20

      // Smooth scroll to player
      setTimeout(() => {
        playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err: any) {
      console.error('Error generating audio:', err);
      setErrorMessage(
        err?.message ||
          'Audio generate karne mein masla paish aaya. Barah-e-karam dobara koshish karein.'
      );
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleSelectHistoryItem = (item: GeneratedAudioItem) => {
    setCurrentAudio(item);
    setText(item.text);
    setSelectedLanguage(item.language);
    setSelectedVoice(item.voiceName);
    setSpeed(item.speed);
    setPitch(item.pitch);
    if (item.style) setStyle(item.style);

    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (currentAudio?.id === id) {
      setCurrentAudio(null);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Kya aap tamam history delete karna chahte hain?')) {
      setHistory([]);
      setCurrentAudio(null);
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    }
  };

  const handleScrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        onOpenHowItWorks={handleScrollToHowItWorks}
      />

      {/* Hero Banner / Subheader */}
      <div className="relative overflow-hidden py-8 sm:py-10 bg-gradient-to-b from-blue-50/50 via-indigo-50/30 to-transparent dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-transparent border-b border-slate-200/50 dark:border-slate-800/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Urdu • English • Hindi • Arabic Neural TTS</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Studio AI Voiceovers{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent">
              In Seconds
            </span>
          </h2>

          <p className="mt-2 text-xs sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Convert any script into realistic, expressive human-grade voiceovers with custom pitch,
            speed modulation, and instant studio WAV downloads.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Validation / Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3 text-rose-800 dark:text-rose-200 text-xs sm:text-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs font-bold underline hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Studio Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Script Editor & Controls (lg: 6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* 1. Large Script Editor with Character Counter & RTL support */}
            <ScriptEditor
              text={text}
              onChangeText={setText}
              selectedLanguage={selectedLanguage}
              onSelectLanguage={setSelectedLanguage}
              speed={speed}
              maxChars={5000}
            />

            {/* 2. Acoustic Speed and Pitch Controls */}
            <AudioControls
              speed={speed}
              onChangeSpeed={setSpeed}
              pitch={pitch}
              onChangePitch={setPitch}
              style={style}
              onChangeStyle={setStyle}
            />
          </div>

          {/* Right Column: Voice Selection & Generation CTA (lg: 6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* 3. Voice Selector with Previews */}
            <VoiceSelector
              selectedVoice={selectedVoice}
              onSelectVoice={setSelectedVoice}
              selectedLanguage={selectedLanguage}
            />

            {/* 4. "Generate Voice" Action Button & Inline Error */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-start justify-between gap-2.5 text-rose-800 dark:text-rose-200 text-xs animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{errorMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="text-[11px] font-bold underline hover:opacity-80 shrink-0 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerateVoice}
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{loadingStep || 'Generating Studio Audio...'}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Generate Voice (آواز تیار کریں)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                <span>Model: Gemini 3.8 / 2.5 Flash TTS</span>
                <span>Output: 24kHz Studio WAV</span>
              </div>
            </div>

            {/* Audio Player directly under Generate button for immediate visibility */}
            {currentAudio && (
              <div ref={playerRef} className="animate-in fade-in slide-in-from-top-2">
                <AudioPlayer currentAudio={currentAudio} />
              </div>
            )}
          </div>
        </div>

        {/* Session Generation History */}
        <HistoryList
          history={history}
          currentAudioId={currentAudio?.id}
          onSelectAudio={handleSelectHistoryItem}
          onDeleteAudio={handleDeleteHistoryItem}
          onClearHistory={handleClearHistory}
        />

        {/* How It Works Section */}
        <div ref={howItWorksRef}>
          <HowItWorks />
        </div>

        {/* FAQ Section */}
        <FAQSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
