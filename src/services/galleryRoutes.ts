import express from "express";
import {
  createPhoto,
  deletePhoto,
  GalleryError,
  getPhoto,
  listPhotos,
  processJob,
  queuePhoto,
} from "./gallery.js";
import { requireTaskIdentity } from "./tasks.js";
export function galleryRouter() {
  const router = express.Router();
  router.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  const handle =
    (
      fn: (req: express.Request, res: express.Response) => Promise<void>,
    ): express.RequestHandler =>
    async (req, res) => {
      try {
        await fn(req, res);
      } catch (error) {
        if (error instanceof GalleryError)
          res
            .status(error.status)
            .json({ error: error.message, code: error.code });
        else if (error instanceof TypeError)
          res.status(400).json({ error: error.message });
        else {
          console.error(JSON.stringify({ event: "gallery_request_failed" }));
          res
            .status(503)
            .json({ error: "The gallery is temporarily unavailable." });
        }
      }
    };
  router.get(
    "/",
    handle(async (req, res) => {
      const offset = Number(req.query.offset || 0);
      if (!Number.isInteger(offset) || offset < 0 || offset > 100000)
        throw new GalleryError(400, "INVALID_PAGE", "Invalid gallery page.");
      res.json(await listPhotos(res.locals.userId, offset));
    }),
  );
  router.post(
    "/",
    express.json({ limit: "25mb" }),
    handle(async (req, res) => {
      res
        .status(201)
        .json(await createPhoto(res.locals.userId, req.body ?? {}));
    }),
  );
  router.get(
    "/:id",
    handle(async (req, res) => {
      res.json(await getPhoto(res.locals.userId, req.params.id as string));
    }),
  );
  router.post(
    "/:id/jobs",
    express.json({ limit: "32kb" }),
    handle(async (req, res) => {
      res
        .status(202)
        .json(
          await queuePhoto(
            res.locals.userId,
            req.params.id as string,
            req.body ?? {},
          ),
        );
    }),
  );
  router.delete(
    "/:id",
    handle(async (req, res) => {
      await deletePhoto(res.locals.userId, req.params.id as string);
      res.status(204).end();
    }),
  );
  return router;
}
export function workerRouter() {
  const router = express.Router();
  router.post(
    "/process-job",
    requireTaskIdentity,
    express.json({ limit: "2kb" }),
    async (req, res) => {
      try {
        await processJob(req.body?.jobId);
        res.status(204).end();
      } catch (error) {
        const status = error instanceof GalleryError ? error.status : 503;
        // Invalid payloads should not be retried by Cloud Tasks indefinitely.
        if (status === 400) res.status(204).end();
        else {
          console.error(
            JSON.stringify({
              event: "worker_delivery_failed",
              code: error instanceof GalleryError ? error.code : "UNKNOWN",
            }),
          );
          res.status(503).json({ error: "Worker temporarily unavailable." });
        }
      }
    },
  );
  return router;
}
