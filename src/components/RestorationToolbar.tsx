import React from 'react';
import { RestorationSettings } from '../types';
import { 
  Sliders, 
  Sun, 
  Contrast as ContrastIcon, 
  Thermometer, 
  Palette, 
  Sparkles, 
  RotateCcw,
  SlidersHorizontal,
  Flame,
  Grid,
  Key,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Calendar,
  MapPin,
  Info,
  History
} from 'lucide-react';

interface RestorationToolbarProps {
  settings: RestorationSettings;
  onUpdateSettings: (updater: (prev: RestorationSettings) => RestorationSettings) => void;
  onResetSettings: () => void;
  onRunColorize: () => void;
  isProcessingAi: boolean;
  aiError?: string | null;
  year?: string;
  location?: string;
  context?: string;
  onYearChange?: (val: string) => void;
  onLocationChange?: (val: string) => void;
  onContextChange?: (val: string) => void;
}

export const RestorationToolbar: React.FC<RestorationToolbarProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
  onRunColorize,
  isProcessingAi,
  aiError,
  year = '',
  location = '',
  context = '',
  onYearChange,
  onLocationChange,
  onContextChange
}) => {

  const applyPreset = (preset: RestorationSettings['activePreset']) => {
    switch (preset) {
      case 'natural':
        onUpdateSettings(prev => ({
          ...prev,
          activePreset: 'natural',
          brightness: 100,
          contrast: 100,
          warmth: 0,
          saturation: 100,
          skinRosiness: 50,
          filmGrain: 10
        }));
        break;
      case 'warm- daylight':
        onUpdateSettings(prev => ({
          ...prev,
          activePreset: 'warm- daylight',
          brightness: 105,
          contrast: 102,
          warmth: 20,
          saturation: 115,
          skinRosiness: 70,
          filmGrain: 5
        }));
        break;
      case 'studio-portrait':
        onUpdateSettings(prev => ({
          ...prev,
          activePreset: 'studio-portrait',
          brightness: 102,
          contrast: 115,
          warmth: 5,
          saturation: 105,
          skinRosiness: 60,
          filmGrain: 0
        }));
        break;
      case 'vibrant':
        onUpdateSettings(prev => ({
          ...prev,
          activePreset: 'vibrant',
          brightness: 108,
          contrast: 110,
          warmth: 10,
          saturation: 135,
          skinRosiness: 80,
          filmGrain: 0
        }));
        break;
      case 'sepia-archival':
        onUpdateSettings(prev => ({
          ...prev,
          activePreset: 'sepia-archival',
          brightness: 95,
          contrast: 105,
          warmth: 40,
          saturation: 45,
          skinRosiness: 20,
          filmGrain: 35
        }));
        break;
    }
  };

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 text-zinc-200 shadow-xl space-y-6">
      {/* Historical Context Form Box */}
      <div className="bg-zinc-950/80 rounded-xl border border-zinc-800 p-3.5 space-y-3">
        <div className="flex items-center space-x-2 border-b border-zinc-800/80 pb-2">
          <History className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Historical Context (AI Guidance)
          </h4>
        </div>

        <div className="space-y-2.5">
          {/* Field 1: Year / Era */}
          <div>
            <label className="text-[11px] font-medium text-zinc-300 flex items-center space-x-1.5 mb-1">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>1. Year / Era</span>
            </label>
            <input
              type="text"
              value={year}
              onChange={(e) => onYearChange?.(e.target.value)}
              placeholder="e.g. 1946, 1920s, WWI..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Field 2: Location / Region */}
          <div>
            <label className="text-[11px] font-medium text-zinc-300 flex items-center space-x-1.5 mb-1">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>2. Location / Region</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => onLocationChange?.(e.target.value)}
              placeholder="e.g. French countryside, Paris, Normandy..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Field 3: Context Details */}
          <div>
            <label className="text-[11px] font-medium text-zinc-300 flex items-center space-x-1.5 mb-1">
              <Info className="w-3 h-3 text-amber-400" />
              <span>3. Context Details</span>
            </label>
            <textarea
              rows={2}
              value={context}
              onChange={(e) => onContextChange?.(e.target.value)}
              placeholder="e.g. military uniforms, blue wool dress, sunny courtyard, profession..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Primary Action Button: Launch Real AI Colorization */}
      <div className="space-y-2">
        <button
          onClick={onRunColorize}
          disabled={isProcessingAi}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-2.5 ${
            isProcessingAi
              ? 'bg-amber-500/50 text-zinc-950 cursor-wait'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-zinc-950 shadow-amber-950/50 hover:scale-[1.01] active:scale-[0.99]'
          }`}
        >
          {isProcessingAi ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
              <span>Processing AI... please wait</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4.5 h-4.5 text-zinc-950 fill-zinc-950" />
              <span className="tracking-wide uppercase text-[11px]">RUN AI RESTORATION & HUMANIZATION</span>
            </>
          )}
        </button>

        {/* Error Alert Box */}
        {aiError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-rose-200">Colorization Error</p>
              <p className="text-[11px] text-rose-300/90 leading-tight">{aiError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-sm text-zinc-100">Live Restoration Fine-Tuning</h3>
        </div>
        <button
          onClick={onResetSettings}
          className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-amber-400 transition"
          title="Reset Sliders"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Preset Buttons */}
      <div>
        <label className="text-xs font-medium text-zinc-400 mb-2 block uppercase tracking-wider">
          Color & Lighting Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { id: 'natural', label: 'Natural Daylight' },
            { id: 'warm- daylight', label: 'Golden Hour' },
            { id: 'studio-portrait', label: 'Studio 85mm' },
            { id: 'vibrant', label: 'Rich Textiles' },
            { id: 'sepia-archival', label: 'Warm Sepia Tint' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                settings.activePreset === p.id
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="space-y-4 pt-2">
        {/* Brightness */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="flex items-center space-x-1 text-zinc-300 font-medium">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Exposure / Exposure Offset</span>
            </span>
            <span className="font-mono text-zinc-400">{settings.brightness}%</span>
          </div>
          <input
            type="range"
            min="60"
            max="140"
            value={settings.brightness}
            onChange={(e) => onUpdateSettings(prev => ({ ...prev, brightness: Number(e.target.value) }))}
            className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Contrast */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="flex items-center space-x-1 text-zinc-300 font-medium">
              <ContrastIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Micro-Contrast & Shadows</span>
            </span>
            <span className="font-mono text-zinc-400">{settings.contrast}%</span>
          </div>
          <input
            type="range"
            min="60"
            max="140"
            value={settings.contrast}
            onChange={(e) => onUpdateSettings(prev => ({ ...prev, contrast: Number(e.target.value) }))}
            className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Warmth */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="flex items-center space-x-1 text-zinc-300 font-medium">
              <Thermometer className="w-3.5 h-3.5 text-orange-400" />
              <span>Color Temperature (Warmth)</span>
            </span>
            <span className="font-mono text-zinc-400">{settings.warmth > 0 ? `+${settings.warmth}` : settings.warmth}</span>
          </div>
          <input
            type="range"
            min="-40"
            max="40"
            value={settings.warmth}
            onChange={(e) => onUpdateSettings(prev => ({ ...prev, warmth: Number(e.target.value) }))}
            className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Saturation */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="flex items-center space-x-1 text-zinc-300 font-medium">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Subtle Pigment Saturation</span>
            </span>
            <span className="font-mono text-zinc-400">{settings.saturation}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="180"
            value={settings.saturation}
            onChange={(e) => onUpdateSettings(prev => ({ ...prev, saturation: Number(e.target.value) }))}
            className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Subsurface Rosiness Glow */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="flex items-center space-x-1 text-zinc-300 font-medium">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Subsurface Rosiness & Flesh Tone</span>
            </span>
            <span className="font-mono text-zinc-400">{settings.skinRosiness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.skinRosiness}
            onChange={(e) => onUpdateSettings(prev => ({ ...prev, skinRosiness: Number(e.target.value) }))}
            className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Film Grain */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="flex items-center space-x-1 text-zinc-300 font-medium">
              <Grid className="w-3.5 h-3.5 text-zinc-400" />
              <span>Vintage Silver Gelatin Grain</span>
            </span>
            <span className="font-mono text-zinc-400">{settings.filmGrain}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            value={settings.filmGrain}
            onChange={(e) => onUpdateSettings(prev => ({ ...prev, filmGrain: Number(e.target.value) }))}
            className="w-full accent-zinc-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
