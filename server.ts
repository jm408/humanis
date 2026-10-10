import { requireAuth } from './src/services/auth.js';
import { aiErrorDetails } from "./src/services/aiError.js";
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { colorizePhotoWithGemini } from './src/services/gemini.js';
import { parseImage } from './src/services/image.js';
import { restoreWithReplicate } from './src/services/replicate.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
export function createApp(dependencies = { colorizePhotoWithGemini, restoreWithReplicate }, authenticate: express.RequestHandler = requireAuth) {
  const app = express();
  app.disable('x-powered-by');
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/auth/config', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    const url = process.env.SUPABASE_URL;
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publishableKey?.startsWith('sb_publishable_')) return res.status(503).json({ error: 'Sign-in is not configured yet.' });
    return res.json({ url, publishableKey });
  });
  app.use(['/api/colorize', '/api/analyze-photo', '/api/auth/me'], authenticate);
  app.get('/api/auth/me', (_req, res) => { res.set('Cache-Control', 'no-store'); res.json({ userId: res.locals.userId }); });
  app.post('/api/colorize', express.json({ limit: '25mb' }), async (req, res) => {
    try {
      const { imageBase64, service = 'auto', prompt, date, era, location } = req.body ?? {};
      parseImage(imageBase64);
      if (!['auto', 'gemini', 'replicate'].includes(service)) return res.status(400).json({ success: false, error: 'Unknown AI service.' });
      validateContext({ prompt, date, era, location });
      // Credentials always come from the server, never from the request.
      const geminiKey = process.env.GEMINI_API_KEY;
      const replicateKey = process.env.REPLICATE_API_TOKEN;
      const useReplicate = service === 'replicate' || (service === 'auto' && !!replicateKey);
      if (useReplicate) {
        if (!replicateKey) return res.status(503).json({ success: false, error: 'Replicate is not configured.' });
        try {
          const restoredImageUrl = await dependencies.restoreWithReplicate({ imageBase64, token: replicateKey });
          return res.json({ success: true, restoredImageUrl, provider: 'replicate' });
        } catch {
          if (service !== 'auto' || !geminiKey) return res.status(502).json({ success: false, error: 'Replicate restoration failed. Please retry.' });
        }
      }
      if (!geminiKey) return res.status(503).json({ success: false, error: 'Gemini is not configured.' });
      const restoredImageUrl = await dependencies.colorizePhotoWithGemini({ imageBase64, year: date || era, location, context: prompt });
      return res.json({ success: true, restoredImageUrl, provider: 'gemini' });
    } catch (error) { return respondError(res, error); }
  });
  app.post('/api/analyze-photo', express.json({ limit: '25mb' }), async (req, res) => {
    try {
      const { imageBase64, prompt } = req.body ?? {};
      const inlineData = parseImage(imageBase64);
      validateContext({ prompt });
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(503).json({ error: 'Gemini is not configured.' });
      const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 120_000 } });
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_ANALYSIS_MODEL || 'gemini-3.6-flash',
        contents: { parts: [{ inlineData }, { text: prompt || 'Analyze this historical photograph: subjects, clothing, estimated era, and conservation instructions.' }] }
      });
      if (!response.text) throw new Error('No analysis returned');
      return res.json({ analysis: response.text, status: 'success' });
    } catch (error) { return respondError(res, error); }
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API endpoint.' }));
  app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(error.type === 'entity.too.large' ? 413 : 400).json({ error: 'Invalid or oversized JSON request.' });
  });
  return app;
}
function validateContext(values: Record<string, unknown>) {
  for (const value of Object.values(values)) if (value != null && (typeof value !== 'string' || value.length > 8000)) throw new TypeError('Context must be text of at most 8000 characters.');
}
function respondError(res: express.Response, error: unknown) {
  const invalid = error instanceof TypeError;
  if (invalid) return res.status(400).json({ success: false, error: error.message });
  const details = aiErrorDetails(error);
  console.error(JSON.stringify({ event: 'ai_processing_failed', status: details.status, reason: details.reason, code: details.code }));
  return res.status(502).json({ success: false, error: details.message, code: details.code });
}
export async function startServer() {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
  const app = createApp();
  if (process.env.NODE_ENV === 'production') {
    const clientDirectory = path.join(directory, 'client');
    app.use(express.static(clientDirectory));
    app.get('*', (_req, res) => res.sendFile(path.join(clientDirectory, 'index.html')));
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  const server = app.listen(port, '0.0.0.0', () => console.log(`Humanis listening on port ${port}`));
  server.on('error', () => { console.error('Unable to listen on configured port'); process.exitCode = 1; });
  const shutdown = () => { server.close(() => process.exit(0)); setTimeout(() => process.exit(1), 10_000).unref(); };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  return server;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer().catch(() => { console.error('Failed to start Humanis'); process.exitCode = 1; });
}
