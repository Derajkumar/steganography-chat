import React from 'react';
import { Terminal, Sparkles, Sunset } from 'lucide-react';

interface ThemeSelectorProps {
  selectedTheme: string;
  onChange: (themeKey: string) => void;
}

export const THEME_PRESETS = [
  {
    key: 'cyber-neon',
    title: 'Cyber Neon Arena',
    description: 'Neon pink and bright cyan tech rules with floating glowing boxes.',
    icon: Sparkles,
    colorClass: 'border-pink-500 text-pink-400 bg-pink-950/20 hover:bg-pink-950/35',
    accentColor: '#ff007f',
    secondaryColor: '#00f0ff'
  },
  {
    key: 'terminal-green',
    title: 'Terminal Operator',
    description: 'Phosphor cathode rays with high contrast monospace terminals.',
    icon: Terminal,
    colorClass: 'border-emerald-500 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/35',
    accentColor: '#4ade80',
    secondaryColor: '#15803d'
  },
  {
    key: 'sunset-pulse',
    title: 'Sunset Pulse',
    description: 'Warm gold gradients and deep purples recalling retro horizons.',
    icon: Sunset,
    colorClass: 'border-orange-500 text-orange-400 bg-orange-950/20 hover:bg-orange-950/35',
    accentColor: '#f59e0b',
    secondaryColor: '#ec4899'
  }
];

export default function ThemeSelector({ selectedTheme, onChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-mono text-slate-400 uppercase tracking-widest block">
        CSS Design Cover Preset
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {THEME_PRESETS.map((theme) => {
          const Icon = theme.icon;
          const isSelected = selectedTheme === theme.key;
          
          return (
            <button
              id={`theme-btn-${theme.key}`}
              key={theme.key}
              type="button"
              onClick={() => onChange(theme.key)}
              className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? `bg-sky-500/10 border-sky-450 text-white shadow-[0_0_15px_rgba(56,189,248,0.15)]`
                  : 'border-white/10 bg-white/5 hover:border-white/15 text-slate-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                <span className="font-semibold text-sm">{theme.title}</span>
              </div>
              <p className="text-xs text-slate-400 leading-tight">
                {theme.description}
              </p>
              
              {/* Colored Dot Indicators */}
              <div className="mt-3 flex gap-1.5 items-center">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: theme.accentColor }}
                />
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: theme.secondaryColor }}
                />
                <span className="text-[10px] text-slate-500 font-mono">CSS DNA</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
