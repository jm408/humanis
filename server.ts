import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { colorizePhotoWithGemini } from "./src/services/gemini.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Real AI Colorization & Photo Restoration Endpoint
  app.post("/api/colorize", async (req, res) => {
    try {
      const { imageBase64, apiKey, service, prompt, date, era, location } = req.body;

      if (!imageBase64) {
        return res.status(400).json({
          success: false,
          error: "A source image in Base64 format is required for colorization."
        });
      }

      const activeApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.REPLICATE_API_TOKEN;

      // 1. REPLICATE API CALL (if user provided a Replicate Token starting with 'r8_' or explicitly requested replicate)
      if (activeApiKey && (activeApiKey.startsWith('r8_') || service === 'replicate')) {
        console.log("Calling Replicate API for photo colorization & restoration with context...");
        
        try {
          const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${activeApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              version: "7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",
              input: {
                image: imageBase64,
                codeformer_fidelity: 0.7,
                background_enhance: true,
                face_upsample: true,
                upscale: 2,
                prompt: `Colorize historical photo. Year: ${date || era || ''}, Location: ${location || ''}. ${prompt || ''}`.trim()
              }
            })
          });

          if (replicateResponse.ok) {
            let prediction = await replicateResponse.json();
            let attempts = 0;
            while (prediction.status !== "succeeded" && prediction.status !== "failed" && attempts < 30) {
              await new Promise(resolve => setTimeout(resolve, 1500));
              attempts++;
              const getRes = await fetch(prediction.urls.get, {
                headers: { "Authorization": `Bearer ${activeApiKey}` }
              });
              prediction = await getRes.json();
            }

            if (prediction.status === "succeeded" && prediction.output) {
              const restoredUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
              return res.json({
                success: true,
                restoredImageUrl: restoredUrl,
                message: "Replicate API restoration & colorization succeeded."
              });
            }
          }
        } catch (repErr: any) {
          console.warn("Replicate fetch warning:", repErr?.message);
        }
      }

      // 2. DIRECT GEMINI API COLORIZATION & HUMANIZATION (Gemini 3.6 Flash / Image generation)
      try {
        console.log("Executing Gemini 3.6 Flash / Multimodal photo colorization & restoration...");
        const restoredBase64 = await colorizePhotoWithGemini({
          imageBase64,
          year: date || era,
          location,
          context: prompt,
          apiKey: activeApiKey
        });

        return res.json({
          success: true,
          restoredImageUrl: restoredBase64,
          message: "Gemini photo colorization and restoration completed successfully."
        });
      } catch (geminiErr: any) {
        console.error("Gemini Colorization Error:", geminiErr?.message || geminiErr);
        
        return res.status(500).json({
          success: false,
          error: "Error during Gemini API colorization: " + (geminiErr?.message || "Unknown error")
        });
      }

    } catch (error: any) {
      console.error("Colorize Endpoint Error:", error);
      res.status(500).json({
        success: false,
        error: "Error during AI colorization: " + (error?.message || "Unknown error")
      });
    }
  });

  // AI Photo Analysis Endpoint using Gemini API
  app.post("/api/analyze-photo", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(200).json({
          analysis: "Gemini API key not provided. Operating in offline restoration analysis mode.",
          recommendations: [
            "Preserve exact facial geometry and unique bone structure.",
            "Apply subsurface scattering for realistic flesh tones and cheek rosiness.",
            "Colorize 1940s textiles (pinafore skirts, wool blend, cotton blouses).",
            "Enhance eye iris catchlights and clear damage/scratches."
          ]
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const { imageBase64, prompt } = req.body;

      const model = "gemini-3.6-flash";
      const contents: any[] = [
        prompt || "Analyze this historical photograph in detail. Identify subject facial features, clothing textiles, architecture background, estimated era, and specific conservation instructions for colorization and photo humanization."
      ];

      if (imageBase64) {
        // Strip data header if present
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        contents.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64
          }
        });
      }

      const response = await ai.models.generateContent({
        model,
        contents
      });

      res.json({
        analysis: response.text,
        status: "success"
      });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({
        error: "Failed to analyze photo with AI",
        details: error?.message || "Unknown error"
      });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Restoration Studio Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
