import React, { useCallback, useEffect, useRef, useState } from "react";
import { zip } from "fflate";
import {
  fetchGallery,
  fetchPhoto,
  GalleryPhoto,
  RestorationVersion,
  queueRestoration,
  removePhoto,
  savePhoto,
  studioPhoto,
  downloadImage,
} from "../api/gallery";
import { PhotoItem } from "../types";
interface BatchFile {
  id: string;
  jobId: string;
  file: File;
  status: string;
  error?: string;
  saved: boolean;
}
function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Unable to read this photo."));
    reader.readAsDataURL(file);
  });
}
export function Gallery({ onOpen }: { onOpen: (photo: PhotoItem) => void }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [batch, setBatch] = useState<BatchFile[]>([]);
  const [importing, setImporting] = useState(false);
  const [year, setYear] = useState("");
  const [location, setLocation] = useState("");
  const [context, setContext] = useState("");
  const [runAfterImport, setRunAfterImport] = useState(true);
  const mounted = useRef(true);
  const refreshing = useRef(false);
  const currentPage = useRef(page);
  currentPage.current = page;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const refresh = useCallback(
    async (quiet = false) => {
      if (refreshing.current) return;
      refreshing.current = true;
      if (!quiet) setLoading(true);
      try {
        const result = await fetchGallery(page * 25);
        if (mounted.current && currentPage.current === page) {
          setPhotos(result.photos);
          setHasMore(result.hasMore);
          setError("");
        }
      } catch (error: any) {
        if (mounted.current) setError(error.message);
      } finally {
        refreshing.current = false;
        if (mounted.current) setLoading(false);
      }
    },
    [page],
  );
  useEffect(() => {
    setSelected([]);
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh(true);
    }, 10000);
    return () => clearInterval(timer);
  }, [refresh]);
  const update = (id: string, values: Partial<BatchFile>) => {
    if (mounted.current)
      setBatch((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...values } : item)),
      );
  };
  async function importBatch() {
    setImporting(true);
    setError("");
    for (const item of batch.filter(
      (item) => item.status !== "Queued" && item.status !== "Saved",
    )) {
      try {
        update(item.id, {
          status: item.saved ? "Queueing" : "Uploading",
          error: undefined,
        });
        if (!item.saved) {
          await savePhoto({
            id: item.id,
            imageBase64: await readFile(item.file),
            title: item.file.name.replace(/\.[^.]+$/, ""),
            year,
            location,
            context,
          });
          update(item.id, { saved: true });
        }
        if (runAfterImport) {
          await queueRestoration(
            item.id,
            { year, location, context },
            item.jobId,
          );
          update(item.id, { status: "Queued" });
        } else update(item.id, { status: "Saved" });
      } catch (error: any) {
        update(item.id, { status: "Failed", error: error.message });
      }
    }
    if (mounted.current) {
      setImporting(false);
      void refresh(true);
    }
  }
  function choose(files: FileList | null) {
    if (!files) return;
    const all = Array.from(files);
    if (all.length > 50) {
      setError("Choose at most 50 photos per import.");
      return;
    }
    if (
      all.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 18 * 1024 * 1024,
      )
    ) {
      setError("Use JPEG, PNG or WebP files, at most 18 MB each.");
      return;
    }
    setError("");
    setBatch(
      all.map((file) => ({
        file,
        id: crypto.randomUUID(),
        jobId: crypto.randomUUID(),
        status: "Ready",
        saved: false,
      })),
    );
  }
  async function queueSelected() {
    setBusy(true);
    setError("");
    const failures: string[] = [];
    for (const id of selected) {
      try {
        await queueRestoration(id, { year, location, context });
      } catch (error: any) {
        failures.push(error.message);
      }
    }
    if (failures.length)
      setError(
        `${failures.length} photo(s) could not be queued: ${failures[0]}`,
      );
    setSelected([]);
    setBusy(false);
    await refresh(true);
  }
  async function deleteOne(photo: GalleryPhoto) {
    if (
      !window.confirm(
        `Delete “${photo.title}” and all its versions permanently?`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await removePhoto(photo.id);
      setSelected((prev) => prev.filter((id) => id !== photo.id));
      await refresh(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function openOne(photo: GalleryPhoto, version?: RestorationVersion) {
    try {
      const fresh = await fetchPhoto(photo.id);
      onOpen(
        studioPhoto(
          fresh,
          version
            ? fresh.versions.find((item) => item.id === version.id)
            : undefined,
        ),
      );
    } catch (error: any) {
      setError(error.message);
    }
  }
  async function exportZip() {
    setBusy(true);
    setError("");
    try {
      const files: Record<string, Uint8Array> = {};
      for (const id of selected) {
        const photo = await fetchPhoto(id);
        const version = photo.versions.find(
          (job) => job.status === "succeeded" && job.resultUrl,
        );
        if (!version)
          throw new Error(
            "Select only photos with completed restorations for ZIP export.",
          );
        const response = await fetch(version.resultUrl!);
        if (!response.ok) throw new Error("Unable to download a restoration.");
        const ext = response.headers.get("content-type")?.includes("png")
          ? "png"
          : response.headers.get("content-type")?.includes("webp")
            ? "webp"
            : "jpg";
        files[
          `${photo.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)}-${photo.id.slice(0, 8)}.${ext}`
        ] = new Uint8Array(await response.arrayBuffer());
      }
      const result = await new Promise<Uint8Array>((resolve, reject) =>
        zip(files, { level: 0 }, (error, data) =>
          error ? reject(error) : resolve(data),
        ),
      );
      const blob = new Blob([new Uint8Array(result).buffer], {
        type: "application/zip",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "humanis-restorations.zip";
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-6 text-zinc-100">
      <div>
        <h1 className="text-2xl font-semibold">My private gallery</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Your originals, restorations and versions, saved to your account.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-950/50 border border-rose-800 p-3 text-sm text-rose-200"
        >
          {error}
        </p>
      )}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
        <h2 className="font-semibold">Import & batch restoration</h2>
        <p className="text-xs text-zinc-400">
          Up to 50 photos per import. Keep this page open during upload; queued
          restorations continue in the background.
        </p>
        <input
          aria-label="Select photos for batch import"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={importing}
          onChange={(event) => choose(event.target.files)}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:p-2 file:text-zinc-200"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs">
            Year / period
            <input
              disabled={importing}
              maxLength={200}
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="mt-1 w-full rounded-lg bg-zinc-950 border border-zinc-700 p-2"
            />
          </label>
          <label className="text-xs">
            Location
            <input
              disabled={importing}
              maxLength={500}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="mt-1 w-full rounded-lg bg-zinc-950 border border-zinc-700 p-2"
            />
          </label>
        </div>
        <label className="block text-xs">
          Shared historical context
          <textarea
            disabled={importing}
            maxLength={8000}
            value={context}
            onChange={(event) => setContext(event.target.value)}
            className="mt-1 w-full rounded-lg bg-zinc-950 border border-zinc-700 p-2"
          />
        </label>
        <label className="flex gap-2 text-xs">
          <input
            type="checkbox"
            checked={runAfterImport}
            disabled={importing}
            onChange={(event) => setRunAfterImport(event.target.checked)}
          />
          Restore after import
        </label>
        {!!batch.length && (
          <>
            <ul
              className="max-h-48 overflow-y-auto space-y-2 text-xs"
              aria-live="polite"
            >
              {batch.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span className="truncate">{item.file.name}</span>
                  <span
                    className={item.error ? "text-rose-300" : "text-zinc-400"}
                  >
                    {item.status}
                    {item.error ? ` — ${item.error}` : ""}
                  </span>
                </li>
              ))}
            </ul>
            <button
              disabled={
                importing ||
                !batch.some((item) => ["Ready", "Failed"].includes(item.status))
              }
              onClick={importBatch}
              className="bg-amber-500 text-zinc-950 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              {importing ? "Importing…" : "Import / retry failed uploads"}
            </button>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-2 items-center text-xs">
        <button
          onClick={() => void refresh()}
          disabled={loading || busy}
          className="bg-zinc-800 rounded-lg px-3 py-2"
        >
          Refresh
        </button>
        <span className="text-zinc-400">{selected.length} selected</span>
        <button
          disabled={!selected.length || busy || importing}
          onClick={queueSelected}
          className="bg-amber-500 text-zinc-950 rounded-lg px-3 py-2 disabled:opacity-40"
        >
          Restore selected with shared context
        </button>
        <button
          disabled={!selected.length || busy}
          onClick={exportZip}
          className="bg-zinc-800 rounded-lg px-3 py-2 disabled:opacity-40"
        >
          Download selected ZIP
        </button>
      </div>
      {loading && !photos.length ? (
        <p>Loading your gallery…</p>
      ) : !photos.length ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 p-10 text-center text-zinc-400">
          Your gallery is empty. Import your first photo above or from the
          studio.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => {
            const current = photo.versions[0];
            const active =
              current && ["queued", "processing"].includes(current.status);
            return (
              <article
                key={photo.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
              >
                <div className="relative bg-zinc-950">
                  <img
                    loading="lazy"
                    draggable={false}
                    src={
                      photo.versions.find((version) => version.resultUrl)
                        ?.resultUrl ||
                      photo.originalUrl ||
                      undefined
                    }
                    alt={photo.title}
                    className="w-full h-52 object-contain select-none"
                  />
                  <input
                    aria-label={`Select ${photo.title}`}
                    type="checkbox"
                    checked={selected.includes(photo.id)}
                    disabled={active || photo.deleting || busy}
                    onChange={(event) =>
                      setSelected((prev) =>
                        event.target.checked
                          ? [...prev, photo.id]
                          : prev.filter((id) => id !== photo.id),
                      )
                    }
                    className="absolute left-3 top-3 w-5 h-5"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <h2 className="font-semibold truncate">{photo.title}</h2>
                  <p className="text-xs text-zinc-400">
                    {photo.year || "Unknown period"} ·{" "}
                    {photo.location || "Unknown location"}
                  </p>
                  <p
                    className={`text-xs ${current?.status === "failed" ? "text-rose-300" : "text-amber-300"}`}
                    role="status"
                  >
                    {photo.deleting
                      ? "Deletion pending"
                      : current
                        ? `${current.status} · ${photo.versions.length} version(s)`
                        : "Original saved"}
                  </p>
                  {current?.error && (
                    <p className="text-xs text-rose-300">{current.error}</p>
                  )}
                  <div className="flex gap-2 text-xs">
                    <button
                      disabled={photo.deleting}
                      onClick={() => openOne(photo)}
                      className="rounded-lg bg-zinc-800 px-3 py-2"
                    >
                      Open in studio
                    </button>
                    <button
                      disabled={active || busy}
                      onClick={() => deleteOne(photo)}
                      className="text-rose-300 disabled:opacity-40"
                    >
                      {photo.deleting ? "Retry deletion" : "Delete"}
                    </button>
                  </div>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-zinc-400">
                      Version history
                    </summary>
                    <ul className="mt-2 space-y-2">
                      {photo.versions.map((version, index) => (
                        <li
                          key={version.id}
                          className="border-t border-zinc-800 pt-2"
                        >
                          <span className="text-zinc-400">
                            Version {photo.versions.length - index} ·{" "}
                            {new Date(version.createdAt).toLocaleString()} ·{" "}
                            {version.status}
                          </span>
                          {version.resultUrl && (
                            <div className="flex gap-3 mt-1">
                              <button
                                className="text-amber-400"
                                onClick={() => openOne(photo, version)}
                              >
                                Compare
                              </button>
                              <button
                                className="text-amber-400"
                                onClick={async () => {
                                  try {
                                    const fresh = await fetchPhoto(photo.id);
                                    const result = fresh.versions.find(
                                      (job) => job.id === version.id,
                                    )?.resultUrl;
                                    if (result)
                                      await downloadImage(
                                        result,
                                        `${photo.title}-${version.id.slice(0, 8)}`,
                                      );
                                  } catch (error: any) {
                                    setError(error.message);
                                  }
                                }}
                              >
                                Download
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <div className="flex justify-between text-xs">
        <button
          disabled={page === 0 || loading}
          onClick={() => setPage((prev) => prev - 1)}
          className="disabled:opacity-40"
        >
          Previous
        </button>
        <span>Page {page + 1}</span>
        <button
          disabled={!hasMore || loading}
          onClick={() => setPage((prev) => prev + 1)}
          className="disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}
