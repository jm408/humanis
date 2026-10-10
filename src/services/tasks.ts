import { CloudTasksClient } from "@google-cloud/tasks";
import { OAuth2Client } from "google-auth-library";
import type { RequestHandler } from "express";
let tasks: CloudTasksClient | undefined;
const verifier = new OAuth2Client();
export function tasksConfigured() {
  return !!(
    process.env.TASKS_PROJECT &&
    process.env.TASKS_LOCATION &&
    process.env.TASKS_QUEUE &&
    process.env.TASKS_SERVICE_ACCOUNT &&
    process.env.APP_URL
  );
}
export async function enqueueJob(jobId: string) {
  if (!tasksConfigured()) throw new Error("TASKS_NOT_CONFIGURED");
  tasks ??= new CloudTasksClient();
  const parent = tasks.queuePath(
    process.env.TASKS_PROJECT!,
    process.env.TASKS_LOCATION!,
    process.env.TASKS_QUEUE!,
  );
  try {
    await tasks.createTask({
      parent,
      task: {
        name: `${parent}/tasks/humanis-${jobId}`,
        dispatchDeadline: { seconds: 300 },
        httpRequest: {
          httpMethod: "POST",
          url: `${process.env.APP_URL!.replace(/\/$/, "")}/api/internal/process-job`,
          headers: { "Content-Type": "application/json" },
          body: Buffer.from(JSON.stringify({ jobId })).toString("base64"),
          oidcToken: {
            serviceAccountEmail: process.env.TASKS_SERVICE_ACCOUNT!,
            audience: process.env.APP_URL!.replace(/\/$/, ""),
          },
        },
      },
    });
  } catch (error: any) {
    if (error?.code !== 6)
      throw error; /* Named tasks deduplicate deliveries. */
  }
}
export const requireTaskIdentity: RequestHandler = async (req, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!token || !tasksConfigured()) {
    res.status(401).json({ error: "Worker authentication required." });
    return;
  }
  try {
    const ticket = await verifier.verifyIdToken({
      idToken: token,
      audience: process.env.APP_URL!.replace(/\/$/, ""),
    });
    const payload = ticket.getPayload();
    if (
      payload?.email !== process.env.TASKS_SERVICE_ACCOUNT ||
      payload.email_verified !== true
    )
      throw new Error("Wrong worker identity");
    next();
  } catch {
    res.status(401).json({ error: "Worker authentication required." });
  }
};
