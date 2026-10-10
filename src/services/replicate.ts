import { setTimeout as delay } from 'node:timers/promises';
export async function restoreWithReplicate({ imageBase64, token }: { imageBase64: string; token: string }): Promise<string> {
  const signal = AbortSignal.timeout(120_000);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST', headers, signal,
    body: JSON.stringify({
      version: process.env.REPLICATE_MODEL_VERSION || '7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56',
      input: { image: imageBase64, codeformer_fidelity: 0.7, background_enhance: true, face_upsample: true, upscale: 2 }
    })
  });
  if (!response.ok) throw new Error('Replicate request failed');
  let prediction = await response.json();
  if (typeof prediction.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(prediction.id)) throw new Error('Invalid prediction ID');
  const url = `https://api.replicate.com/v1/predictions/${prediction.id}`;
  while (!['succeeded', 'failed', 'canceled'].includes(prediction.status)) {
    await delay(1500, undefined, { signal });
    const poll = await fetch(url, { headers, signal });
    if (!poll.ok) throw new Error('Replicate polling failed');
    prediction = await poll.json();
  }
  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (prediction.status !== 'succeeded' || typeof output !== 'string' || !output.startsWith('https://')) throw new Error('Replicate returned no image');
  return output;
}
