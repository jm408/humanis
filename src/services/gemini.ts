import { parseImage } from "./image.js";
import { GoogleGenAI } from "@google/genai";

export interface ColorizeGeminiOptions {
  imageBase64: string;
  year?: string;
  location?: string;
  context?: string;
}

/**
 * Sends a multimodal photo restoration request directly to Gemini API.
 */
export async function colorizePhotoWithGemini(options: ColorizeGeminiOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Please provide GEMINI_API_KEY.");
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      timeout: 120_000
    }
  });

  const { data: cleanBase64, mimeType } = parseImage(options.imageBase64);

  const promptText = `Act as an expert historical photograph conservator. Restore, colorize, and humanize this image. 
Historical context provided by user:
- Year/Period: ${options.year || 'Not specified'}
- Location/Region: ${options.location || 'Not specified'}
- Additional details: ${options.context || 'None'}
Requirements: Generate a realistic colorized version. Restore sharp eye catchlights, accurate skin tones (subsurface scattering), and period-accurate clothing pigments matching the specified year and location (e.g. military uniforms, landscape vegetation, architecture). Return the processed high-definition color image.`;

  const modelsToTry = [process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image"];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Sending image restoration request to Gemini API (${modelName})...`);
      const response = await ai.models.generateContent({
        model: modelName,
        config: { responseModalities: ["TEXT", "IMAGE"] },
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const respMime = part.inlineData.mimeType || "image/jpeg";
            console.log(`Gemini API (${modelName}) successfully returned colorized Base64 image.`);
            return `data:${respMime};base64,${part.inlineData.data}`;
          }
        }
      }
    } catch (err: any) {
      console.warn(`Gemini model ${modelName} request failed.`);
      lastError = err;
    }
  }

  if (lastError) {
    throw lastError;
  }
  throw new Error("Gemini API did not return image data for this photograph.");
}
