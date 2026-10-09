export interface ColorizeRequest {
  imageBase64: string;
  apiKey?: string;
  service?: 'replicate' | 'gemini' | 'auto';
  prompt?: string;
  era?: string;
  date?: string;
  location?: string;
}

export interface ColorizeResponse {
  success: boolean;
  restoredImageUrl: string;
  message?: string;
  error?: string;
}

/**
 * Sends a POST request to the server /api/colorize endpoint
 * to perform real AI image restoration and colorization.
 */
export async function processAiColorization(req: ColorizeRequest): Promise<ColorizeResponse> {
  try {
    const response = await fetch('/api/colorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });

    const data: ColorizeResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'AI colorization API call failed.');
    }

    return data;
  } catch (err: any) {
    console.error('Error during AI colorization request:', err);
    throw new Error(err.message || 'Unable to connect to the AI colorization server.');
  }
}
