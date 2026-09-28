import React from 'react';
import { Sliders, Gauge, Activity, RotateCcw, Wand2 } from 'lucide-react';
import { STYLE_PRESETS } from '../data/presets';

interface AudioControlsProps {
  speed: number;
  onChangeSpeed: (speed: number) => void;
  pitch: number;
  onChangePitch: (pitch: number) => void;
  style: string;
  onChangeStyle: (style: string) => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  speed,
  onChangeSpeed,
  pitch,
  onChangePitch,
  style,
  onChangeStyle,
}) => {
  const speedPresets = [0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Acoustic Controls & Modulation
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Fine-tune cadence, frequency, and vocal expressiveness
            </p>
          </div>
        </div>

        {/* Reset All button */}
        {(speed !== 1.0 || pitch !== 1.0 || style !== '') && (
          <button
            type="button"
            onClick={() => {
              onChangeSpeed(1.0);
              onChangePitch(1.0);
              onChangeStyle('');
            }}
            className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Speed Slider */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Gauge className="w-3.5 h-3.5 text-blue-500" />
              <span>Speaking Speed (رفتار)</span>
            </div>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
              {speed.toFixed(2)}x
            </span>
          </div>

          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={speed}
            onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />

          {/* Quick speed preset chips */}
          <div className="flex items-center justify-between gap-1 pt-1">
            {speedPresets.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onChangeSpeed(val)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  Math.abs(speed - val) < 0.02
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {val}x
              </button>
            ))}
          </div>
        </div>

        {/* Pitch Slider */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Activity className="w-3.5 h-3.5 text-purple-500" />
              <span>Voice Pitch (سر / ٹون)</span>
            </div>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/60">
              {pitch < 0.85 ? 'Deep' : pitch > 1.15 ? 'High' : 'Normal'} ({pitch.toFixed(2)})
            </span>
          </div>

          <input
            type="range"
            min="0.7"
            max="1.3"
            step="0.05"
            value={pitch}
            onChange={(e) => onChangePitch(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <button
              type="button"
              onClick={() => onChangePitch(0.8)}
              className="hover:text-purple-500"
            >
              Bass / Deep (0.8x)
            </button>
            <button
              type="button"
              onClick={() => onChangePitch(1.0)}
              className="font-bold hover:text-indigo-500"
            >
              Balanced (1.0x)
            </button>
            <button
              type="button"
              onClick={() => onChangePitch(1.2)}
              className="hover:text-purple-500"
            >
              Bright / High (1.2x)
            </button>
          </div>
        </div>
      </div>

      {/* Style & Emotion Prompt Pills */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
          <span>Vocal Style & Delivery Tone (Optional)</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STYLE_PRESETS.map((p) => {
            const isActive = style === p.value;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => onChangeStyle(isActive ? '' : p.value)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
