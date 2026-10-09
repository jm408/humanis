export type ViewMode = 'split' | 'side-by-side' | 'magnifier' | 'overlay';

export interface FaceHotspot {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  label: string;
  title: string;
  originalNote: string;
  restoredNote: string;
}

export interface PhotoItem {
  id: string;
  title: string;
  year: string;
  location: string;
  originalUrl: string;
  restoredUrl: string;
  description: string;
  historicalEra: string;
  hotspots: FaceHotspot[];
  conservationReport: {
    facialIntegrityScore: number;
    skinTextureScore: number;
    damageRemovedScore: number;
    textileAccuracyScore: number;
    overallMasteryScore: number;
    summary: string;
    details: {
      category: string;
      originalIssue: string;
      restorationApplied: string;
    }[];
  };
}

export interface RestorationSettings {
  sliderPosition: number; // 0 - 100
  viewMode: ViewMode;
  zoomLevel: number; // 1 - 4
  panX: number;
  panY: number;
  brightness: number; // 50 - 150
  contrast: number; // 50 - 150
  warmth: number; // -50 - 50
  saturation: number; // 0 - 200
  skinRosiness: number; // 0 - 100
  eyeClarity: number; // 0 - 100
  filmGrain: number; // 0 - 100
  activePreset: 'natural' | 'warm- daylight' | 'studio-portrait' | 'vibrant' | 'sepia-archival';
  showHotspots: boolean;
  showGrid: boolean;
}
