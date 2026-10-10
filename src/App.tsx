import { Gallery } from "./components/Gallery";
import { BuildVersion } from "./components/BuildVersion";
import {
  savePhoto,
  queueRestoration,
  fetchPhoto,
  studioPhoto,
  downloadImage,
} from "./api/gallery";
import React, { useState, useEffect } from "react";
import { PhotoItem, RestorationSettings, FaceHotspot } from "./types";
import { Header } from "./components/Header";
import { ComparisonCanvas } from "./components/ComparisonCanvas";
import { RestorationToolbar } from "./components/RestorationToolbar";
import { ConservationReport } from "./components/ConservationReport";
import { GeminiAnalysisModal } from "./components/GeminiAnalysisModal";
import { UploadModal } from "./components/UploadModal";
import { urlToBase64 } from "./utils/imageUtils";
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

export default function App() {
  const [year, setYear] = useState("");
  const [location, setLocation] = useState("");
  const [context, setContext] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [activePhoto, setActivePhoto] = useState<PhotoItem>({
    id: "user-portrait",
    title: "Historical Restoration",
    year: "",
    location: "",
    originalUrl: "",
    restoredUrl: "",
    description: "",
    historicalEra: "Archival Portrait",
    hotspots: [],
    conservationReport: {
      facialIntegrityScore: 100,
      skinTextureScore: 100,
      damageRemovedScore: 100,
      textileAccuracyScore: 100,
      overallMasteryScore: 100,
      summary: "Enter historical context & launch AI engine.",
      details: [],
    },
  });

  const [activeTab, setActiveTab] = useState<
    "studio" | "report" | "ai-analysis" | "gallery"
  >("studio");
  const [selectedHotspot, setSelectedHotspot] = useState<FaceHotspot | null>(
    null,
  );

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // AI Processing State
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  useEffect(() => {
    try {
      localStorage.removeItem("user_ai_api_key");
    } catch {
      /* Storage may be disabled. */
    }
  }, []);

  // Restoration Sliders
  const [settings, setSettings] = useState<RestorationSettings>({
    sliderPosition: 50,
    viewMode: "split",
    zoomLevel: 1,
    panX: 0,
    panY: 0,
    brightness: 100,
    contrast: 100,
    warmth: 0,
    saturation: 100,
    skinRosiness: 50,
    eyeClarity: 85,
    filmGrain: 10,
    activePreset: "natural",
    showHotspots: true,
    showGrid: false,
  });

  const handleResetSettings = () => {
    setSettings({
      sliderPosition: 50,
      viewMode: "split",
      zoomLevel: 1,
      panX: 0,
      panY: 0,
      brightness: 100,
      contrast: 100,
      warmth: 0,
      saturation: 100,
      skinRosiness: 50,
      eyeClarity: 85,
      filmGrain: 10,
      activePreset: "natural",
      showHotspots: true,
      showGrid: false,
    });
  };

  const [pendingJob, setPendingJob] = useState<{
    photoId: string;
    jobId: string;
  } | null>(null);
  const handlePhotoUploaded = (newPhoto: PhotoItem) => {
    setPhotos((prev) => [newPhoto, ...prev]);
    setActivePhoto(newPhoto);
    setYear(newPhoto.year);
    setLocation(newPhoto.location);
    setContext(newPhoto.description);
    setActiveTab("studio");
    setAiError(null);
  };
  const handleRunAiColorization = async () => {
    if (!activePhoto.originalUrl) {
      setIsUploadOpen(true);
      return;
    }
    setIsProcessingAi(true);
    setAiError(null);
    try {
      if (!activePhoto.saved) {
        await savePhoto({
          id: activePhoto.id,
          imageBase64: await urlToBase64(activePhoto.originalUrl),
          title: activePhoto.title,
          year,
          location,
          context,
        });
        setActivePhoto((prev) =>
          prev.id === activePhoto.id ? { ...prev, saved: true } : prev,
        );
      }
      const job = await queueRestoration(activePhoto.id, {
        year,
        location,
        context,
      });
      setPendingJob({ photoId: activePhoto.id, jobId: job.id });
    } catch (error: any) {
      setAiError(error.message);
      setIsProcessingAi(false);
    }
  };
  const handleSaveOriginal = async () => {
    if (!activePhoto.originalUrl || activePhoto.saved) return;
    setIsProcessingAi(true);
    setAiError(null);
    try {
      await savePhoto({
        id: activePhoto.id,
        imageBase64: await urlToBase64(activePhoto.originalUrl),
        title: activePhoto.title,
        year,
        location,
        context,
      });
      setActivePhoto((prev) => ({ ...prev, saved: true }));
    } catch (error: any) {
      setAiError(error.message);
    } finally {
      setIsProcessingAi(false);
    }
  };
  useEffect(() => {
    if (!pendingJob) return;
    let cancelled = false;
    let polling = false;
    const poll = async () => {
      if (polling) return;
      polling = true;
      try {
        const photo = await fetchPhoto(pendingJob.photoId);
        const job = photo.versions.find(
          (version) => version.id === pendingJob.jobId,
        );
        if (cancelled || !job) return;
        if (job.status === "succeeded") {
          const result = studioPhoto(photo, job);
          setActivePhoto((prev) => (prev.id === photo.id ? result : prev));
          setPhotos((prev) =>
            prev.map((item) => (item.id === photo.id ? result : item)),
          );
          setSettings((prev) => ({
            ...prev,
            viewMode: "split",
            sliderPosition: 50,
          }));
          setPendingJob(null);
          setIsProcessingAi(false);
          setAiError(null);
        } else if (job.status === "failed") {
          setAiError(job.error || "Processing failed. Retry from the gallery.");
          setPendingJob(null);
          setIsProcessingAi(false);
        }
      } catch (error: any) {
        if (!cancelled)
          setAiError(error.message + " Your job remains saved in the gallery.");
      } finally {
        polling = false;
      }
    };
    void poll();
    const timer = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pendingJob]);
  const handleExport = async () => {
    if (!activePhoto.restoredUrl) return;
    try {
      await downloadImage(
        activePhoto.restoredUrl,
        `${activePhoto.title || "humanis-restoration"}.jpg`,
      );
    } catch (error: any) {
      setAiError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onExport={handleExport}
      />

      <div className="max-w-7xl w-full mx-auto px-4 pt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
        {activePhoto.originalUrl && (
          <>
            <span>
              {activePhoto.saved
                ? "Saved to your private gallery"
                : "Not saved yet"}
            </span>
            <button
              disabled={isProcessingAi || activePhoto.saved}
              onClick={handleSaveOriginal}
              className="text-amber-400 disabled:opacity-40"
            >
              Save original
            </button>
          </>
        )}
        {pendingJob && (
          <span role="status">
            Restoration queued / processing. It continues if you close this
            page.
          </span>
        )}
      </div>
      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div hidden={activeTab !== "gallery"}>
          <Gallery
            onOpen={(photo) => {
              handlePhotoUploaded(photo);
            }}
          />
        </div>
        {/* STUDIO TAB */}
        {activeTab === "studio" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Context Badge Header (Ultra-compact mobile) */}
            <div className="bg-zinc-900/80 rounded-xl border border-zinc-800 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-500/10 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold uppercase">
                    Target Context
                  </span>
                  <span className="text-xs text-zinc-300 font-mono font-medium">
                    {year || "Unknown Year"} • {location || "Unknown Location"}
                  </span>
                </div>
                <h2 className="text-base sm:text-xl font-bold text-zinc-50 tracking-tight">
                  {activePhoto.title || "AI Colorization Studio"}
                </h2>
              </div>

              {/* Quick Jump Hotspot Badges */}
              {activePhoto.hotspots.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 shrink-0">
                  {activePhoto.hotspots.map((spot) => (
                    <button
                      key={spot.id}
                      onClick={() => {
                        setSelectedHotspot(spot);
                        setSettings((prev) => ({
                          ...prev,
                          showHotspots: true,
                        }));
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium transition ${
                        selectedHotspot?.id === spot.id
                          ? "bg-amber-500 text-zinc-950 border-amber-400 font-bold"
                          : "bg-zinc-950 text-amber-300 border-zinc-800"
                      }`}
                    >
                      {spot.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
              {/* Primary Stage (8 cols on desktop) */}
              <div className="lg:col-span-8 h-full">
                <ComparisonCanvas
                  photo={activePhoto}
                  settings={settings}
                  onUpdateSettings={setSettings}
                  onSelectHotspot={setSelectedHotspot}
                  selectedHotspot={selectedHotspot}
                  isProcessingAi={
                    isProcessingAi &&
                    (!pendingJob || pendingJob.photoId === activePhoto.id)
                  }
                  onOpenUpload={() => setIsUploadOpen(true)}
                  onRunColorize={handleRunAiColorization}
                />
              </div>

              {/* Sidebar Controls (4 cols on desktop) */}
              <div className="lg:col-span-4 space-y-4 sm:space-y-6">
                <RestorationToolbar
                  settings={settings}
                  onUpdateSettings={setSettings}
                  onResetSettings={handleResetSettings}
                  onRunColorize={handleRunAiColorization}
                  isProcessingAi={
                    isProcessingAi &&
                    (!pendingJob || pendingJob.photoId === activePhoto.id)
                  }
                  aiError={aiError}
                  year={year}
                  location={location}
                  context={context}
                  onYearChange={(val) => {
                    setYear(val);
                    setActivePhoto((prev) => ({ ...prev, year: val }));
                  }}
                  onLocationChange={(val) => {
                    setLocation(val);
                    setActivePhoto((prev) => ({ ...prev, location: val }));
                  }}
                  onContextChange={(val) => {
                    setContext(val);
                    setActivePhoto((prev) => ({ ...prev, description: val }));
                  }}
                />

                {/* Directives Summary Card */}
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3">
                  <div className="flex items-center space-x-2 border-b border-zinc-800 pb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                      Humanis Directives
                    </h4>
                  </div>
                  <ul className="text-xs space-y-1.5 text-zinc-300">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Identity:</strong> 100% facial geometry
                        preserved.
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Incrustation:</strong> Skin tones & subsurface
                        scattering.
                      </span>
                    </li>
                  </ul>
                  <button
                    onClick={() => setActiveTab("report")}
                    className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 text-amber-400 text-xs font-medium rounded-xl border border-zinc-800 transition flex items-center justify-center space-x-1 mt-1"
                  >
                    <span>Conservation Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORT TAB */}
        {activeTab === "report" && (
          <ConservationReport
            photo={activePhoto}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}

        {/* AI ANALYSIS TAB */}
        {activeTab === "ai-analysis" && (
          <div className="max-w-4xl mx-auto space-y-6 py-4">
            <div className="bg-zinc-900 rounded-2xl border border-amber-500/30 p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-50">
                    Gemini AI Inspector
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Advanced neural analysis & historical optimization
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs rounded-xl shadow-lg transition flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Gemini AI Inspector</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <BuildVersion />
      {/* Modals */}
      <GeminiAnalysisModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        photo={activePhoto}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onPhotoUploaded={handlePhotoUploaded}
      />
    </div>
  );
}
