import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Trash2,
  Sparkles,
  Clock,
  ClipboardPaste,
  Check,
  Languages,
} from 'lucide-react';
import { Language, LanguageCode, SampleScript } from '../types';
import { LANGUAGES, SAMPLE_SCRIPTS } from '../data/presets';

interface ScriptEditorProps {
  text: string;
  onChangeText: (newText: string) => void;
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  speed: number;
  maxChars?: number;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  text,
  onChangeText,
  selectedLanguage,
  onSelectLanguage,
  speed,
  maxChars = 5000,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);

  const currentLangObj = LANGUAGES.find((l) => l.code === selectedLanguage) || LANGUAGES[0];
  const isRtl = currentLangObj.dir === 'rtl';

  // Words count calculation
  const wordsCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  // Approximate reading time (average speaking rate ~140 wpm at 1.0x)
  const estimatedSeconds = Math.max(1, Math.round((wordsCount / (140 * speed)) * 60));
  const estimatedMin = Math.floor(estimatedSeconds / 60);
  const estimatedSec = estimatedSeconds % 60;
  const formattedTime =
    wordsCount === 0
      ? '0s'
      : estimatedMin > 0
      ? `${estimatedMin}m ${estimatedSec}s`
      : `${estimatedSec}s`;

  // Filter sample scripts for selected language
  const availableSamples = SAMPLE_SCRIPTS.filter((s) => s.language === selectedLanguage);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Clipboard copy failed', e);
    }
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        onChangeText((text ? text + ' ' : '') + clipText.slice(0, maxChars - text.length));
      }
    } catch (e) {
      console.warn('Clipboard read permission denied', e);
    }
  };

  const handleLoadSample = (sample: SampleScript) => {
    onChangeText(sample.text);
    setShowPresetsDropdown(false);
  };

  const getPlaceholder = () => {
    switch (selectedLanguage) {
      case 'ur':
        return 'اپنا اسکرپٹ یہاں لکھیں یا چسپاں کریں... (زیادہ سے زیادہ ۵۰۰۰ حروف)';
      case 'ar':
        return 'اكتب النص أو الصقه هنا لتحويله إلى تعليق صوتي فائق النقاء...';
      case 'hi':
        return 'अपनी स्क्रिप्ट यहाँ लिखें या पेस्ट करें... (अधिकतम ५००० अक्षर)';
      case 'en':
      default:
        return 'Write or paste your script here to generate natural studio-quality voiceover... (max 5,000 characters)';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all">
      {/* Top Header Row: Language Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Language / زبان
          </span>
        </div>

        {/* 4 Language Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl">
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === selectedLanguage;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => onSelectLanguage(lang.code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
                <span className="text-[10px] opacity-75 font-normal">({lang.name})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Bar: Presets & Utility Tools */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPresetsDropdown((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/60 dark:border-indigo-800/50 transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Load Sample Script ({availableSamples.length})</span>
          </button>

          {/* Presets Dropdown */}
          {showPresetsDropdown && (
            <div className="absolute left-0 mt-1.5 w-72 sm:w-80 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-30 p-2 text-left">
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                Sample Scripts for {currentLangObj.name}
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {availableSamples.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleLoadSample(sample)}
                    className="w-full text-left p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition group"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      <span>{sample.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                        {sample.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {sample.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Text Tools */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <button
            type="button"
            onClick={handlePaste}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 transition title-tip"
            title="Paste text from clipboard"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!text}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 disabled:opacity-40 transition"
            title="Copy script"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onChangeText('')}
            disabled={!text}
            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 disabled:opacity-40 transition"
            title="Clear all text"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Script Textarea */}
      <div className="relative">
        <textarea
          rows={7}
          dir={isRtl ? 'rtl' : 'ltr'}
          value={text}
          onChange={(e) => {
            if (e.target.value.length <= maxChars) {
              onChangeText(e.target.value);
            }
          }}
          placeholder={getPlaceholder()}
          className={`w-full p-4 rounded-xl border transition-all text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-y bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 leading-relaxed ${
            currentLangObj.fontClass
          } ${isRtl ? 'text-right' : 'text-left'}`}
        />

        {/* Floating Quick Count & Reading Stats */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 px-1 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{wordsCount} words</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Est. {formattedTime}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono">
            <span
              className={
                text.length > maxChars * 0.95
                  ? 'text-rose-500 font-bold'
                  : text.length > maxChars * 0.8
                  ? 'text-amber-500'
                  : 'text-slate-500 dark:text-slate-400'
              }
            >
              {text.length.toLocaleString()}
            </span>
            <span>/</span>
            <span>{maxChars.toLocaleString()} characters</span>
          </div>
        </div>
      </div>
    </div>
  );
};
