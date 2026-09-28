import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  urduQuestion?: string;
  answer: string;
}

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'Which AI model powers the speech synthesis?',
      urduQuestion: 'کون سا ماڈل آواز تیار کرنے کے لیے استعمال ہوتا ہے؟',
      answer:
        'VoiceOver Pro utilizes Google Gemini TTS models (gemini-2.5-flash-preview-tts & gemini-3.8-flash-lite-tts). These neural speech models produce lifelike breathing, natural pauses, emotional inflection, and studio-grade audio.',
    },
    {
      question: 'How are raw PCM audio streams converted into playable WAV files?',
      urduQuestion: 'کیا تیار شدہ آڈیو موبائل اور کمپیوٹر پر چلے گی؟',
      answer:
        'Gemini TTS outputs raw 24,000Hz 16-bit linear PCM audio. Our server-side processing engine automatically packages this raw PCM data into a standard 44-byte RIFF/WAV container. This guarantees compatibility with all media players (VLC, QuickTime, Windows Media Player) and video editing suites (Premiere Pro, CapCut, DaVinci Resolve).',
    },
    {
      question: 'Which languages and scripts are supported?',
      urduQuestion: 'کیا اردو اور عربی کے لیے دائیں سے بائیں (RTL) سپورٹ موجود ہے؟',
      answer:
        'We support Urdu (اردو), English, Hindi (हिन्दी), and Arabic (العربية). For Urdu and Arabic, full right-to-left (RTL) editing with Nastaliq and Naskh typography is automatically enabled for fluid script drafting.',
    },
    {
      question: 'What is the maximum script length?',
      urduQuestion: 'ایک وقت میں کتنا بڑا اسکرپٹ لکھا جا سکتا ہے؟',
      answer:
        'You can generate voiceovers up to 5,000 characters per synthesis (~700 to 1,000 words), representing approximately 4 to 6 minutes of continuous broadcast speech. Longer scripts can easily be generated in sections and combined.',
    },
    {
      question: 'How do the Speed and Pitch sliders work?',
      urduQuestion: 'رفتار اور پچ کو کیسے تبدیل کیا جائے؟',
      answer:
        'The speed slider modulates tempo from 0.5x (slow, deliberate) to 2.0x (fast, energetic). Pitch allows tuning between lower bass resonance and bright treble tones. Both neural style prompts and Web Audio API resampling ensure you receive exactly the cadence you need.',
    },
    {
      question: 'Can I use the generated audio for commercial videos and podcasts?',
      urduQuestion: 'کیا یہ آڈیو یوٹیوب اور پوڈکاسٹس میں استعمال ہو سکتی ہے؟',
      answer:
        'Yes! The generated WAV files can be freely integrated into your YouTube videos, podcasts, TikTok/Reels commercials, audiobooks, educational e-learning modules, and presentations.',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Frequently Asked Questions (عمومی سوالات)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Answers to common questions about Gemini TTS, audio formats, and usage
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100/50 dark:hover:bg-slate-900 transition"
              >
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {faq.question}
                  </span>
                  {faq.urduQuestion && (
                    <span className="block text-xs font-urdu text-indigo-600 dark:text-indigo-400 mt-0.5" dir="rtl">
                      {faq.urduQuestion}
                    </span>
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="p-4 pt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
