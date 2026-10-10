import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { parseImage } from "./image.js";
import { enqueueJob, tasksConfigured } from "./tasks.js";
import { colorizePhotoWithGemini } from "./gemini.js";
import { aiErrorDetails } from "./aiError.js";
const bucket = "humanis-private";
export class GalleryError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function galleryConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}
export function adminClient() {
  if (!galleryConfigured())
    throw new GalleryError(
      503,
      "GALLERY_NOT_CONFIGURED",
      "The private gallery is not configured yet.",
    );
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
function dbError(error: any) {
  if (!error) return;
  const text = String(error.message || "");
  if (text.includes("PHOTO_NOT_FOUND"))
    throw new GalleryError(404, "PHOTO_NOT_FOUND", "Photo not found.");
  if (text.includes("JOB_ACTIVE"))
    throw new GalleryError(
      409,
      "JOB_ACTIVE",
      "This photo already has a treatment in progress.",
    );
  if (text.includes("JOB_LIMIT"))
    throw new GalleryError(
      429,
      "JOB_LIMIT",
      "You already have 100 photos waiting for processing.",
    );
  if (text.includes("JOB_CONFLICT"))
    throw new GalleryError(
      409,
      "JOB_CONFLICT",
      "This treatment identifier is already in use.",
    );
  throw new GalleryError(
    503,
    "GALLERY_UNAVAILABLE",
    "The private gallery is temporarily unavailable.",
  );
}
export function validateUuid(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new GalleryError(
      400,
      "INVALID_ID",
      "Invalid photo or treatment identifier.",
    );
  return value;
}
export function contextFields(body: Record<string, unknown>) {
  const result: Record<string, string> = {};
  for (const [key, limit] of [
    ["title", 200],
    ["year", 200],
    ["location", 500],
    ["context", 8000],
  ] as const) {
    const value = body[key] ?? "";
    if (typeof value !== "string" || value.length > limit)
      throw new GalleryError(
        400,
        "INVALID_CONTEXT",
        `${key} must be text of at most ${limit} characters.`,
      );
    result[key] = value.trim();
  }
  return result;
}
export async function createPhoto(
  owner: string,
  body: Record<string, unknown>,
  db = adminClient(),
) {
  const id = validateUuid(body.id);
  const fields = contextFields(body);
  const { mimeType, data } = parseImage(body.imageBase64);
  const bytes = Buffer.from(data, "base64");
  // Reject non-image data instead of trusting the declared MIME header.
  const valid =
    mimeType === "image/jpeg"
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : mimeType === "image/png"
        ? bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes.subarray(0, 4).toString() === "RIFF" &&
          bytes.subarray(8, 12).toString() === "WEBP";
  if (!valid)
    throw new GalleryError(
      400,
      "INVALID_IMAGE",
      "The file is not a valid JPEG, PNG or WebP image.",
    );
  const existing = await db
    .from("humanis_photos")
    .select("*")
    .eq("id", id)
    .eq("owner_id", owner)
    .maybeSingle();
  dbError(existing.error);
  if (existing.data) return existing.data; // Retry after a lost HTTP response must not create another photo.
  const path = `${owner}/${id}/original.${mimeType.split("/")[1]}`;
  const upload = await db.storage
    .from(bucket)
    .upload(path, bytes, { contentType: mimeType, upsert: false });
  // A retried upload may have left the original in Storage before its DB insert.
  if (upload.error && String((upload.error as any).statusCode) !== "409")
    dbError(upload.error);
  const result = await db
    .from("humanis_photos")
    .insert({
      id,
      owner_id: owner,
      title: fields.title || "Historical photo",
      year: fields.year,
      location: fields.location,
      context: fields.context,
      original_path: path,
      mime_type: mimeType,
    })
    .select("*")
    .single();
  dbError(result.error);
  return result.data;
}
async function signed(db: SupabaseClient, path: string | null) {
  if (!path) return null;
  const { data, error } = await db.storage
    .from(bucket)
    .createSignedUrl(path, 900);
  dbError(error);
  return data!.signedUrl;
}
export async function photoView(db: SupabaseClient, photo: any, jobs: any[]) {
  const originalUrl = photo.deleting_at
    ? null
    : await signed(db, photo.original_path);
  const versions = await Promise.all(
    jobs.map(async (job) => ({
      id: job.id,
      status: job.status,
      year: job.year,
      location: job.location,
      context: job.context,
      error: job.error_message,
      code: job.error_code,
      createdAt: job.created_at,
      resultUrl: photo.deleting_at ? null : await signed(db, job.result_path),
    })),
  );
  return {
    id: photo.id,
    title: photo.title,
    year: photo.year,
    location: photo.location,
    context: photo.context,
    createdAt: photo.created_at,
    deleting: !!photo.deleting_at,
    originalUrl,
    versions,
  };
}
export async function listPhotos(
  owner: string,
  offset: number,
  db = adminClient(),
) {
  const photos = await db
    .from("humanis_photos")
    .select("*")
    .eq("owner_id", owner)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + 24);
  dbError(photos.error);
  const ids = photos.data!.map((photo) => photo.id);
  if (!ids.length) return { photos: [], hasMore: false };
  const jobs = await db
    .from("humanis_jobs")
    .select("*")
    .eq("owner_id", owner)
    .in("photo_id", ids)
    .order("created_at", { ascending: false });
  dbError(jobs.error);
  // Recover jobs persisted before a failed enqueue; no browser-owned worker is used.
  for (const job of jobs
    .data!.filter((job) => job.status === "queued" && !job.enqueued_at)
    .slice(0, 10)) {
    try {
      await dispatchJob(job.id, db);
    } catch {
      /* Shown as queued; retrying the job endpoint also repairs dispatch. */
    }
  }
  return {
    photos: await Promise.all(
      photos.data!.map((photo) =>
        photoView(
          db,
          photo,
          jobs.data!.filter((job) => job.photo_id === photo.id),
        ),
      ),
    ),
    hasMore: photos.data!.length === 25,
  };
}
export async function getPhoto(owner: string, id: string, db = adminClient()) {
  const photo = await db
    .from("humanis_photos")
    .select("*")
    .eq("id", validateUuid(id))
    .eq("owner_id", owner)
    .maybeSingle();
  dbError(photo.error);
  if (!photo.data)
    throw new GalleryError(404, "PHOTO_NOT_FOUND", "Photo not found.");
  const jobs = await db
    .from("humanis_jobs")
    .select("*")
    .eq("photo_id", id)
    .eq("owner_id", owner)
    .order("created_at", { ascending: false });
  dbError(jobs.error);
  return photoView(db, photo.data, jobs.data!);
}
export async function dispatchJob(id: string, db = adminClient()) {
  await enqueueJob(id);
  const update = await db
    .from("humanis_jobs")
    .update({ enqueued_at: new Date().toISOString() })
    .eq("id", id)
    .is("enqueued_at", null);
  dbError(update.error);
}
export async function queuePhoto(
  owner: string,
  id: string,
  body: Record<string, unknown>,
  db = adminClient(),
  dispatch = dispatchJob,
) {
  if (!tasksConfigured())
    throw new GalleryError(
      503,
      "TASKS_NOT_CONFIGURED",
      "Background processing is not configured yet.",
    );
  const fields = contextFields(body);
  const result = await db.rpc("humanis_create_job", {
    p_id: validateUuid(body.jobId),
    p_photo: validateUuid(id),
    p_owner: owner,
    p_year: fields.year,
    p_location: fields.location,
    p_context: fields.context,
  }).single<{ id: string; status: string; enqueued_at: string | null }>();
  dbError(result.error);
  const job = result.data;
  if (job.status === "queued" && !job.enqueued_at) {
    try {
      await dispatch(job.id, db);
    } catch {
      throw new GalleryError(
        503,
        "DISPATCH_PENDING",
        "Photo saved, but processing could not be queued yet. Retry this action.",
      );
    }
  }
  return { id: job.id, status: job.status };
}
export async function deletePhoto(
  owner: string,
  id: string,
  db = adminClient(),
) {
  const result = await db.rpc("humanis_begin_delete", {
    p_id: validateUuid(id),
    p_owner: owner,
  }).single<{ original_path: string }>();
  dbError(result.error);
  const jobs = await db
    .from("humanis_jobs")
    .select("result_path")
    .eq("photo_id", id)
    .eq("owner_id", owner);
  dbError(jobs.error);
  const paths = [
    result.data.original_path,
    ...jobs.data!.map((job) => job.result_path).filter(Boolean),
  ];
  const removed = await db.storage.from(bucket).remove(paths);
  dbError(removed.error);
  const deleted = await db
    .from("humanis_photos")
    .delete()
    .eq("id", id)
    .eq("owner_id", owner)
    .not("deleting_at", "is", null);
  dbError(deleted.error);
}
export async function processJob(
  id: string,
  db = adminClient(),
  restore = colorizePhotoWithGemini,
) {
  validateUuid(id);
  const lease = randomUUID();
  const claim = await db.rpc("humanis_claim_job", { p_id: id, p_lease: lease });
  dbError(claim.error);
  const job = claim.data?.[0];
  if (!job) {
    const current = await db
      .from("humanis_jobs")
      .select("status")
      .eq("id", id)
      .maybeSingle();
    dbError(current.error);
    if (current.data?.status === "processing")
      throw new GalleryError(
        503,
        "JOB_BUSY",
        "A worker is already processing this photo.",
      );
    return; // Unknown, deleted or terminal jobs are safely acknowledged.
  }
  try {
    const photo = await db
      .from("humanis_photos")
      .select("*")
      .eq("id", job.photo_id)
      .eq("owner_id", job.owner_id)
      .single();
    dbError(photo.error);
    const original = await db.storage
      .from(bucket)
      .download(photo.data.original_path);
    dbError(original.error);
    const bytes = Buffer.from(await original.data!.arrayBuffer());
    const imageBase64 = `data:${photo.data.mime_type};base64,${bytes.toString("base64")}`;
    const restored = await restore({
      imageBase64,
      year: job.year,
      location: job.location,
      context: job.context,
    });
    const result = parseImage(restored);
    const path = `${job.owner_id}/${job.photo_id}/${job.id}.${result.mimeType.split("/")[1]}`;
    const upload = await db.storage
      .from(bucket)
      .upload(path, Buffer.from(result.data, "base64"), {
        contentType: result.mimeType,
        upsert: true,
      });
    dbError(upload.error);
    const saved = await db
      .from("humanis_jobs")
      .update({
        status: "succeeded",
        result_path: path,
        lease_until: null,
        finished_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("lease_token", lease)
      .eq("status", "processing");
    dbError(saved.error);
    console.log(JSON.stringify({ event: "job_succeeded", jobId: id }));
  } catch (error) {
    // Persist AI failures rather than silently retrying a chargeable generation.
    // Infrastructure failures return non-2xx so Cloud Tasks retries after the lease expires.
    if (error instanceof GalleryError) throw error;
    const details = aiErrorDetails(error);
    console.error(
      JSON.stringify({
        event: "job_failed",
        jobId: id,
        status: details.status,
        code: details.code,
        reason: details.reason,
      }),
    );
    const failed = await db
      .from("humanis_jobs")
      .update({
        status: "failed",
        error_code: details.code,
        error_message: details.message,
        lease_until: null,
        finished_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("lease_token", lease);
    dbError(failed.error);
  }
}
