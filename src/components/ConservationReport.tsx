import React from 'react';
import { PhotoItem } from '../types';
import { 
  FileText, 
  Upload, 
  ShieldCheck, 
  User, 
  Sparkles, 
  Shirt, 
  Camera 
} from 'lucide-react';

interface ConservationReportProps {
  photo: PhotoItem;
  onOpenUpload?: () => void;
}

export const ConservationReport: React.FC<ConservationReportProps> = ({ photo, onOpenUpload }) => {
  const isRestored = Boolean(photo?.restoredUrl && photo.restoredUrl !== photo.originalUrl);

  // État vide : aucune photo ou aucune restauration effectuée
  if (!photo?.originalUrl || !isRestored) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-zinc-900/80 rounded-2xl border border-zinc-800 shadow-2xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
          <FileText className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-zinc-100">No Conservation Report Available</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Upload a historical photo and click <strong>RUN AI RESTORATION</strong> to generate a detailed conservation and fidelity audit.
          </p>
        </div>
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-lg transition inline-flex items-center space-x-2 mt-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>
        )}
      </div>
    );
  }

  const { conservationReport } = photo;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 px-2">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/40 rounded-2xl border border-amber-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                OFFICIAL CONSERVATOR REPORT
              </span>
              <span className="text-xs text-zinc-400">{photo.year || 'Unknown Year'} • {photo.location || 'Unknown Location'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-50 tracking-tight">
              {photo.title}
            </h2>
            <p className="text-sm text-zinc-300 max-w-2xl leading-relaxed">
              {conservationReport.summary}
            </p>
          </div>

          <div className="bg-zinc-950/90 border border-amber-500/40 rounded-2xl p-4 text-center shrink-0 shadow-xl">
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1">Fidelity Score</div>
            <div className="text-4xl font-extrabold text-amber-400 font-mono">
              {conservationReport.overallMasteryScore}%
            </div>
            <div className="text-[11px] font-medium text-emerald-400 flex items-center justify-center space-x-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Identity Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Directives Audit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-100">1. Facial Integrity</h3>
              <span className="text-xs font-mono text-emerald-400">{conservationReport.facialIntegrityScore}% Matched</span>
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Preserved exact facial bone geometry, ocular sockets, nose contours, and natural expressions.
          </p>
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-100">2. Carnation & Skin Realism</h3>
              <span className="text-xs font-mono text-emerald-400">{conservationReport.skinTextureScore}% Authentic</span>
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Zero plastic AI smoothing. Retains micro-textures, pores, and natural skin undertones.
          </p>
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-100">3. Damage Removal</h3>
              <span className="text-xs font-mono text-emerald-400">{conservationReport.damageRemovedScore}% Conserved</span>
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Eliminated scratches, chemical specks, and grain noise while preserving underlying textile fibers.
          </p>
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-100">4. Textiles & Environment</h3>
              <span className="text-xs font-mono text-emerald-400">{conservationReport.textileAccuracyScore}% Accurate</span>
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Colorized clothing garments, background architecture, and natural lighting using historical color science.
          </p>
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-3 col-span-1 md:col-span-2">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-100">5. Optical Emulation</h3>
              <span className="text-xs font-mono text-blue-400">Natural Daylight • Shallow Depth of Field</span>
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Simulated prime lens portrait optics with soft background falloff, isolating subjects naturally in atmospheric daylight.
          </p>
        </div>
      </div>

      {/* Itemized Log */}
      {conservationReport.details.length > 0 && (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-base text-zinc-100">Itemized Restoration Log</h3>
          </div>
          <div className="divide-y divide-zinc-800/80">
            {conservationReport.details.map((item, idx) => (
              <div key={idx} className="py-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div className="font-semibold text-amber-300 flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{item.category}</span>
                </div>
                <div className="text-zinc-400">
                  <span className="text-zinc-500 block font-mono text-[10px] uppercase">Degradation:</span>
                  {item.originalIssue}
                </div>
                <div className="text-zinc-200">
                  <span className="text-emerald-400 block font-mono text-[10px] uppercase">Treatment:</span>
                  {item.restorationApplied}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};