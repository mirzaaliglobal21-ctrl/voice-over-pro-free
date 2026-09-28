import React from 'react';
import { PenLine, SlidersHorizontal, DownloadCloud, Sparkles } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Draft or Paste Your Script',
      urdu: 'اپنا اسکرپٹ لکھیں یا چسپاں کریں',
      description:
        'Write or paste your script up to 5,000 characters in Urdu, English, Hindi, or Arabic with instant word count and estimated reading time.',
      icon: PenLine,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      step: '02',
      title: 'Select Voice & Modulation',
      urdu: 'آواز، رفتار اور ٹون کا انتخاب کریں',
      description:
        'Select from 6 studio personas (Male & Female), listen to live previews, and modulate speed (0.5x–2.0x) and pitch for custom expression.',
      icon: SlidersHorizontal,
      color: 'from-indigo-600 to-purple-600',
    },
    {
      step: '03',
      title: 'Synthesize & Export Studio WAV',
      urdu: 'آواز تیار کریں اور ڈاؤنلوڈ کریں',
      description:
        'Generate high-fidelity audio powered by Gemini TTS. Play, scrub, loop, and download pristine 24kHz uncompressed WAV audio instantly.',
      icon: DownloadCloud,
      color: 'from-purple-600 to-pink-600',
    },
  ];

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simple 3-Step Workflow</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          How VoiceOver Pro Works
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Turn written words into emotional, studio-quality speech with next-generation neural voice models.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="relative p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 text-left transition-transform hover:-translate-y-1"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center font-bold text-sm shadow-md mb-4`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Step {item.step}
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {item.title}
              </h3>
              <p className="text-[11px] font-urdu text-indigo-700 dark:text-indigo-300 mt-0.5" dir="rtl">
                {item.urdu}
              </p>

              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
