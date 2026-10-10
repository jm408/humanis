import { authenticatedFetch } from '../auth';
import { urlToBase64 } from "../utils/imageUtils";
import React, { useState } from 'react';
import { Sparkles, X, Loader2, Bot } from 'lucide-react';
import { PhotoItem } from '../types';

interface GeminiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: PhotoItem;
}

export const GeminiAnalysisModal: React.FC<GeminiAnalysisModalProps> = ({
  isOpen,
  onClose,
  photo
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  if (!isOpen) return null;

  // Formats Markdown (bold, headings, bullet points) into styled React elements
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-1.5" />;

      // Headings
      if (trimmed.startsWith('# ')) {
        return (
          <h3 key={idx} className="text-sm font-bold text-amber-400 mt-3 mb-1">
            {trimmed.replace(/^#+\s*/, '')}
          </h3>
        );
      }
      if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-xs font-bold text-amber-300 mt-2.5 mb-1 uppercase tracking-wider">
            {trimmed.replace(/^#+\s*/, '')}
          </h4>
        );
      }

      // Bullet points
      const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed);
      if (isBullet) {
        trimmed = trimmed.replace(/^(\*|-|\d+\.)\s*/, '');
      }

      // Bold text parsing
      const parts = trimmed.split(/(\*\*.*?\*\*)/g);
      const parsedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-zinc-100">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start space-x-2 my-1 pl-1">
            <span className="text-amber-400 text-xs shrink-0 mt-0.5">•</span>
            <span className="text-xs text-zinc-300 leading-relaxed">{parsedLine}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-xs text-zinc-300 leading-relaxed my-1">
          {parsedLine}
        </p>
      );
    });
  };

  const handleRunAiAnalysis = async (customPrompt?: string) => {
    setLoading(true);
    setAiResult(null);

    const contextInfo = `Year: ${photo.year || 'Unknown'}, Location: ${photo.location || 'Unknown'}`;
    const defaultPrompt = customPrompt || prompt || `Analyze this specific historical photo (${contextInfo}). Provide a short 3-point diagnostic focusing strictly on facial catchlights, period clothing pigments, and optical depth restoration. Keep it concise.`;

    try {
      const response = await authenticatedFetch('/api/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: defaultPrompt,
          imageBase64: await urlToBase64(photo.originalUrl || '')
        })
      });

      const data = await response.json();
      if (!response.ok || !data.analysis) throw new Error(data.error || 'No analysis returned.');
      setAiResult(data.analysis);
    } catch (err) {
      console.error(err);
      setAiResult("Inspection failed. Please check network connection or API credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-zinc-100 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-zinc-950 px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-zinc-50">Gemini AI Photo Inspector</h3>
              <p className="text-xs text-zinc-400">Deep multimodal analysis & restoration recommendation engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Preset Prompts */}
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-2 block uppercase tracking-wider">
              Quick AI Diagnostics
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleRunAiAnalysis("Analyze facial identity preservation, eye catchlights, and skin subsurface scattering for the subjects in this photo. Keep response under 4 bullet points.")}
                className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 hover:border-amber-500/40 text-left text-xs text-zinc-300 hover:text-amber-300 transition"
              >
                <span className="font-semibold block text-zinc-100">👁️ Eye Catchlight & Facial Audit</span>
                <span>Check pupil sharpness & identity match</span>
              </button>
              <button
                onClick={() => handleRunAiAnalysis("Audit clothing textiles, fabric weave, and period pigment accuracy for the specified era. Keep response under 4 bullet points.")}
                className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 hover:border-amber-500/40 text-left text-xs text-zinc-300 hover:text-amber-300 transition"
              >
                <span className="font-semibold block text-zinc-100">👗 Period Textile Color Audit</span>
                <span>Verify fabric weave & period pigment accuracy</span>
              </button>
            </div>
          </div>

          {/* Custom Prompt Input */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask Gemini AI about facial structure, lighting, or historical details..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
              />
              <button
                onClick={() => handleRunAiAnalysis()}
                disabled={loading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition disabled:opacity-50 shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Analyze</span>}
              </button>
            </div>
          </div>

          {/* AI Result Box */}
          {aiResult && (
            <div className="bg-zinc-950 rounded-xl border border-amber-500/30 p-4 space-y-2">
              <div className="flex items-center space-x-2 border-b border-zinc-800 pb-2">
                <Bot className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-semibold text-amber-300 uppercase">Gemini AI Diagnostic Output</span>
              </div>
              <div className="text-xs text-zinc-200 leading-relaxed font-sans">
                {renderFormattedText(aiResult)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-zinc-950 px-5 py-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};