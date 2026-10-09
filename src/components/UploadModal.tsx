import React, { useState } from 'react';
import { Upload, X, Link as LinkIcon, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import { PhotoItem } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoUploaded: (newPhoto: PhotoItem) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onPhotoUploaded
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [location, setLocation] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        setPreviewFile(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPreviewFile(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeImage = previewFile || imageUrl || 'https://picsum.photos/seed/vintage-portrait/800/1200';

    const customItem: PhotoItem = {
      id: `user-upload-${Date.now()}`,
      title: title || 'User Uploaded Historical Portrait',
      year: year || '1946',
      location: location || 'France',
      originalUrl: activeImage,
      restoredUrl: activeImage, // Simulated restoration layer
      historicalEra: 'Archival Portrait',
      description: 'Custom photo loaded into the AuraRestore engine for AI facial humanization, noise reduction, and colorization.',
      hotspots: [
        {
          id: 'user-face-1',
          x: 50,
          y: 40,
          label: 'Primary Subject',
          title: 'Facial Anatomy & Eyes',
          originalNote: 'Monochrome contrast, film grain.',
          restoredNote: 'Reconstructed pupil catchlights and natural flesh undertones.'
        }
      ],
      conservationReport: {
        facialIntegrityScore: 98.5,
        skinTextureScore: 97.2,
        damageRemovedScore: 99.0,
        textileAccuracyScore: 96.8,
        overallMasteryScore: 98.0,
        summary: 'Custom restoration processed. Preserved 100% facial geometry and unique bone structure.',
        details: [
          {
            category: 'Facial Preservation',
            originalIssue: 'Monochrome shadows.',
            restorationApplied: 'Enhanced ocular sclera, skin subsurface scattering, and crisp feature details.'
          }
        ]
      }
    };

    onPhotoUploaded(customItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-zinc-100 flex flex-col">
        {/* Modal Header */}
        <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-base text-zinc-50">Upload Historical Photo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative ${
              dragActive ? 'border-amber-400 bg-amber-500/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {previewFile ? (
              <div className="space-y-2">
                <img
                  src={previewFile}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  className="max-h-36 mx-auto rounded-lg border border-zinc-700 object-contain"
                />
                <p className="text-xs text-amber-400 font-medium">Image Loaded Ready for Restoration!</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-zinc-900 text-amber-400 flex items-center justify-center mx-auto border border-zinc-800">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="text-xs text-zinc-300 font-medium">
                  Drag and drop your B&W or damaged photo here
                </div>
                <p className="text-[11px] text-zinc-500">Supports JPG, PNG, WEBP up to 25MB</p>
              </div>
            )}
          </div>

          {/* Or URL input */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400">Or Image URL</label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/historical-portrait.jpg"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">Photo Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Family Portrait"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/60"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-amber-400 block mb-1">1. Year / Era</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 1946, 1920s, WWI..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/60"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-amber-400 block mb-1">2. Location / Region</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. French countryside, Paris..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-950/40 transition flex items-center justify-center space-x-2 mt-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load into Restoration Engine</span>
          </button>
        </form>
      </div>
    </div>
  );
};
