import React from 'react';
import { 
  Sparkles, 
  Upload, 
  Download, 
  Info, 
  SlidersHorizontal, 
  Camera 
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'studio' | 'report' | 'ai-analysis';
  setActiveTab: (tab: 'studio' | 'report' | 'ai-analysis') => void;
  onOpenUpload: () => void;
  onOpenAiModal: () => void;
  onExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenAiModal,
  onExport
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        
        {/* Logo & Branding */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 p-0.5 shadow-md">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-zinc-50">
                Humanis
              </h1>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 hidden md:block">
              Historical Restoration & Immersion
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'studio'
                ? 'bg-zinc-800 text-amber-400 font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Studio</span>
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'report'
                ? 'bg-zinc-800 text-amber-400 font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Report</span>
          </button>
        </nav>

        {/* Quick Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <button
            onClick={onOpenAiModal}
            className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Inspector</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-semibold">Upload</span>
          </button>

          <button
            onClick={onExport}
            className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition shadow"
            title="Export"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

      </div>
    </header>
  );
};