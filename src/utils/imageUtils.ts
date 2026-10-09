/**
 * Converts an image URL (Blob, HTTP, or asset path) into a clean Base64 data URL string.
 */
export async function urlToBase64(url: string): Promise<string> {
  if (url.startsWith('data:image/')) {
    return url;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2D canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve(dataUrl);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (err) => reject(new Error('Failed to load image from URL for Base64 conversion'));
    img.src = url;
  });
}
