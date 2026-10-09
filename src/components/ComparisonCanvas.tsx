import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PhotoItem, RestorationSettings, FaceHotspot } from '../types';
import { 
  Columns, 
  Layers, 
  Search, 
  Sparkles, 
  Loader2, 
  Cpu, 
  Upload,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface ComparisonCanvasProps {
  photo: PhotoItem;
  settings: RestorationSettings;
  onUpdateSettings: (updater: (prev: RestorationSettings) => RestorationSettings) => void;
  onSelectHotspot: (hotspot: FaceHotspot | null) => void;
  selectedHotspot: FaceHotspot | null;
  isProcessingAi?: boolean;
  onOpenUpload?: () => void;
  onRunColorize?: () => void;
}

export const ComparisonCanvas: React.FC<ComparisonCanvasProps> = ({
  photo,
  settings,
  onUpdateSettings,
  onSelectHotspot,
  selectedHotspot,
  isProcessingAi = false,
  onOpenUpload,
  onRunColorize
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const baseImgRef = useRef<HTMLImageElement>(null);
  
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);

  const isRestoredReady = Boolean(photo?.restoredUrl && photo.restoredUrl !== photo.originalUrl);

  // Ajustement strict de l'image superposée aux dimensions de l'image de base
  const updateImgDimensions = useCallback(() => {
    if (baseImgRef.current) {
      setImgDimensions({
        width: baseImgRef.current.clientWidth,
        height: baseImgRef.current.clientHeight
      });
    }
  }, []);

  useEffect(() => {
    updateImgDimensions();
    window.addEventListener('resize', updateImgDimensions);
    return () => window.removeEventListener('resize', updateImgDimensions);
  }, [updateImgDimensions, photo?.originalUrl, photo?.restoredUrl]);

  // Calcul des filtres de réglage fin
  const getRestoredFilterStyle = useCallback(() => {
    const b = settings.brightness / 100;
    const c = settings.contrast / 100;
    const s = settings.saturation / 100;
    
    let warmthFilter = '';
    if (settings.warmth > 0) {
      warmthFilter = `sepia(${settings.warmth / 150}) hue-rotate(-5deg)`;
    } else if (settings.warmth < 0) {
      warmthFilter = `hue-rotate(${settings.warmth}deg)`;
    }

    return {
      filter: `brightness(${b}) contrast(${c}) saturate(${s}) ${warmthFilter}`.trim()
    };
  }, [settings.brightness, settings.contrast, settings.saturation, settings.warmth]);

  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
    onUpdateSettings(prev => ({ ...prev, sliderPosition: percentage }));
  }, [onUpdateSettings]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingSlider && e.touches[0]) {
        handleSliderMove(e.touches[0].clientX);
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider) {
        handleSliderMove(e.clientX);
      }
    };
    const handleMouseUp = () => setIsDraggingSlider(false);

    if (isDraggingSlider) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingSlider, handleSliderMove]);

  const getOriginalBadgeText = () => {
    const y = photo?.year?.trim() || 'Unknown Year';
    const l = photo?.location?.trim() || 'Unknown Location';
    return `${y} • ${l}`;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
      
      {/* Top Bar */}
      <div className="z-20 bg-zinc-900/90 backdrop-blur-md px-3 py-2 border-b border-zinc-800 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => onUpdateSettings(prev => ({ ...prev, viewMode: 'split' }))}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded text-xs font-medium transition ${
              settings.viewMode === 'split' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400'
            }`}
            title="Split Slider"
          >
            <Columns className="w-4 h-4" />
          </button>
          <button
            onClick={() => onUpdateSettings(prev => ({ ...prev, viewMode: 'side-by-side' }))}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded text-xs font-medium transition ${
              settings.viewMode === 'side-by-side' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400'
            }`}
            title="Side by Side"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => onUpdateSettings(prev => ({ ...prev, viewMode: 'magnifier' }))}
            className={`hidden sm:flex items-center p-1.5 sm:px-2.5 sm:py-1 rounded text-xs font-medium transition ${
              settings.viewMode === 'magnifier' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400'
            }`}
            title="Magnifier"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {photo?.originalUrl && onRunColorize && (
          <button
            onClick={onRunColorize}
            disabled={isProcessingAi}
            className="flex sm:hidden items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs shadow"
          >
            {isProcessingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isProcessingAi ? 'AI...' : 'Restore'}</span>
          </button>
        )}

        <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => onUpdateSettings(prev => ({ ...prev, zoomLevel: Math.max(1, prev.zoomLevel - 0.5) }))}
            className="p-1 text-zinc-400 hover:text-zinc-100"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-1 text-zinc-300">
            {Math.round(settings.zoomLevel * 100)}%
          </span>
          <button
            onClick={() => onUpdateSettings(prev => ({ ...prev, zoomLevel: Math.min(3, prev.zoomLevel + 0.5) }))}
            className="p-1 text-zinc-400 hover:text-zinc-100"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Stage */}
      <div 
        ref={containerRef}
        className="relative flex-1 bg-zinc-900 overflow-hidden flex items-center justify-center min-h-[380px] sm:min-h-[500px] touch-none"
      >
        {isProcessingAi && (
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-4 text-center space-y-3">
            <Cpu className="w-10 h-10 animate-pulse text-amber-400" />
            <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Humanizing Photo...
            </h4>
            <p className="text-xs text-amber-300/80 max-w-xs">
              Calculating period pigments, skin subsurface scattering, and natural lighting.
            </p>
          </div>
        )}

        {!photo?.originalUrl ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100 mb-1">
              No Photo Uploaded
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs mb-4">
              Upload a historical B&W photo to begin restoration.
            </p>
            <button
              onClick={onOpenUpload}
              className="px-4 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs shadow-lg"
            >
              Upload Photo
            </button>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
            
            {/* Conteneur ajusté strictement à l'image */}
            <div className="relative max-w-full max-h-[65vh] rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
              
              {/* IMAGE DE DROITE (Base) */}
              <img
                ref={baseImgRef}
                src={isRestoredReady ? photo.restoredUrl : photo.originalUrl}
                alt="Restored HD"
                onLoad={updateImgDimensions}
                className="w-auto h-auto max-h-[65vh] max-w-full object-contain block"
                style={isRestoredReady ? getRestoredFilterStyle() : undefined}
              />

              {/* Filtre de rosité (uniquement si l'IA a tourné) */}
              {isRestoredReady && settings.skinRosiness > 0 && (
                <div 
                  className="absolute inset-0 pointer-events-none mix-blend-soft-light transition-opacity duration-75"
                  style={{
                    backgroundColor: 'rgb(244, 114, 182)',
                    opacity: settings.skinRosiness / 300
                  }}
                />
              )}

              {/* Bannières d'attente si l'IA n'a pas encore tourné */}
              {!isRestoredReady && (
                <div className="absolute inset-y-0 right-0 left-1/2 bg-zinc-950/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 text-center pointer-events-none border-l border-amber-500/30">
                  <Sparkles className="w-5 h-5 text-amber-400 mb-1.5 animate-pulse" />
                  <span className="text-[11px] font-bold text-zinc-100 uppercase tracking-wide">
                    Ready for AI
                  </span>
                  <span className="text-[10px] text-zinc-300 max-w-[140px] mt-0.5">
                    Click RUN AI RESTORATION to generate colorized pixels
                  </span>
                </div>
              )}

              {/* IMAGE DE GAUCHE (Superposition découpée) */}
              <div 
                className="absolute top-0 left-0 bottom-0 overflow-hidden z-10"
                style={{ width: `${settings.sliderPosition}%` }}
              >
                <img
                  src={photo.originalUrl}
                  alt="Original B&W"
                  className="max-h-[65vh] max-w-none object-contain block"
                  style={{
                    width: imgDimensions ? `${imgDimensions.width}px` : '100%',
                    height: imgDimensions ? `${imgDimensions.height}px` : '100%'
                  }}
                />
                
                <span className="absolute top-2 left-2 bg-zinc-950/80 backdrop-blur-md text-zinc-300 text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-700/60 uppercase whitespace-nowrap">
                  {getOriginalBadgeText()}
                </span>
              </div>

              {/* Badge HD */}
              <span className="absolute top-2 right-2 bg-amber-500 text-zinc-950 text-[10px] font-bold font-mono px-2 py-0.5 rounded shadow uppercase z-20">
                {isRestoredReady ? 'Humanis HD' : 'Original N&B'}
              </span>

              {/* Curseur de séparation */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-amber-400 cursor-ew-resize z-30 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
                style={{ left: `${settings.sliderPosition}%` }}
                onMouseDown={() => setIsDraggingSlider(true)}
                onTouchStart={() => setIsDraggingSlider(true)}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center shadow-xl border-2 border-zinc-950 font-bold">
                  ↔
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};