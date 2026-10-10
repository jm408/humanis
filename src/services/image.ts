/** Only inline images are accepted; remote URLs are never fetched by the server. */
export function parseImage(value: unknown): { mimeType: string; data: string } {
  if (typeof value !== 'string') throw new TypeError('A Base64 image is required.');
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || match[2].length % 4 !== 0) throw new TypeError('Use a JPEG, PNG or WebP Base64 data URL.');
  if (Buffer.byteLength(match[2], 'base64') > 18 * 1024 * 1024) throw new TypeError('Image must be at most 18 MB.');
  return { mimeType: match[1], data: match[2] };
}
