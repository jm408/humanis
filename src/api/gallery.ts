import { authenticatedFetch } from "../auth";
import type { PhotoItem } from "../types";
export interface RestorationVersion {
  id: string;
  status: "queued" | "processing" | "succeeded" | "failed";
  year: string;
  location: string;
  context: string;
  error: string | null;
  code: string | null;
  createdAt: string;
  resultUrl: string | null;
}
export interface GalleryPhoto {
  id: string;
  title: string;
  year: string;
  location: string;
  context: string;
  originalUrl: string | null;
  createdAt: string;
  deleting: boolean;
  versions: RestorationVersion[];
}
async function json<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Gallery request failed.");
  return data;
}
export const fetchGallery = (offset = 0) =>
  authenticatedFetch(`/api/photos?offset=${offset}`).then((response) =>
    json<{ photos: GalleryPhoto[]; hasMore: boolean }>(response),
  );
export const fetchPhoto = (id: string) =>
  authenticatedFetch(`/api/photos/${id}`).then((response) =>
    json<GalleryPhoto>(response),
  );
export async function savePhoto(body: {
  id: string;
  imageBase64: string;
  title: string;
  year: string;
  location: string;
  context: string;
}) {
  return json<{ id: string }>(
    await authenticatedFetch("/api/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}
export async function queueRestoration(
  id: string,
  fields: { year: string; location: string; context: string },
  jobId = crypto.randomUUID(),
) {
  return json<{ id: string; status: string }>(
    await authenticatedFetch(`/api/photos/${id}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, jobId }),
    }),
  );
}
export const removePhoto = (id: string) =>
  authenticatedFetch(`/api/photos/${id}`, { method: "DELETE" }).then(
    (response) => json<void>(response),
  );
export function studioPhoto(
  photo: GalleryPhoto,
  version?: RestorationVersion,
): PhotoItem {
  return {
    id: photo.id,
    saved: true,
    title: photo.title,
    year: version?.year ?? photo.year,
    location: version?.location ?? photo.location,
    description: version?.context ?? photo.context,
    originalUrl: photo.originalUrl || "",
    restoredUrl:
      version?.resultUrl ||
      photo.versions.find((job) => job.status === "succeeded")?.resultUrl ||
      photo.originalUrl ||
      "",
    historicalEra: "Archival Photo",
    hotspots: [],
    conservationReport: {
      facialIntegrityScore: 0,
      skinTextureScore: 0,
      damageRemovedScore: 0,
      textileAccuracyScore: 0,
      overallMasteryScore: 0,
      summary:
        "Saved restoration. Automated fidelity scores have not been measured.",
      details: [],
    },
  };
}
export async function downloadImage(url: string, name: string) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error("Download expired. Refresh the gallery and retry.");
  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
