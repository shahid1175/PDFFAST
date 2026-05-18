import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Initialize Gemini
  const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing from environment variables");
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    
    // Log key presence and length safely
    console.log(`Gemini API Key detected (length: ${apiKey?.length || 0})`);
    
    try {
      return new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI:", e);
      throw e;
    }
  };

  // Helper for retrying AI calls with exponential backoff
  const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        const isQuotaError = err.message?.includes("429") || err.message?.toLowerCase().includes("quota");
        const isBatchSizeError = err.message?.includes("413") || err.message?.includes("too large");
        
        if (isQuotaError && i < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, i);
          console.warn(`Quota exceeded. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        if (isBatchSizeError) {
          throw new Error("The document is too complex for AI processing. Try a smaller range.");
        }
        
        throw err;
      }
    }
    throw lastError;
  };

  // API Route for Gemini Summarization
  app.post("/api/gemini/summarize", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: "No readable text found in document to summarize." });
      }

      console.log("Summarizing text, length:", text.length);
      const ai = getAI();
      
      const response = await withRetry(async () => {
        return await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: [{ parts: [{ text: `Summarize the following document content in 3 key bullet points:\n\n${text.substring(0, 50000)}` }] }]
        });
      });
      
      const summary = response.text || "No summary generated.";
      res.json({ summary });
    } catch (error: any) {
      console.error("Summarization error:", error);
      const isQuota = error.message?.includes("429") || error.message?.toLowerCase().includes("quota") || error.message?.includes("RESOURCES_EXHAUSTED");
      res.status(isQuota ? 429 : 500).json({ 
        error: isQuota 
          ? "AI service is temporarily unavailable due to high demand. Please try again later." 
          : error.message || "Failed to summarize document" 
      });
    }
  });

  // API Route for Gemini OCR
  app.post("/api/gemini/ocr", async (req, res) => {
    try {
      const { images } = req.body; // Array of base64 images
      if (!images || !Array.isArray(images)) {
        return res.status(400).json({ error: "Images array is required" });
      }

      console.log(`Processing OCR for ${images.length} pages`);
      const ai = getAI();
      let fullOCRText = "";

      // Process up to first 5 pages for free tier stability
      const pagesToProcess = Math.min(images.length, 5);
      
      for (let i = 0; i < pagesToProcess; i++) {
          const base64Data = images[i].includes(',') ? images[i].split(',')[1] : images[i];
          const prompt = "Extract all text from this page exactly as it appears. If it's in Bengali, preserve the Bengali characters.";
          
          try {
              const response = await withRetry(async () => {
                return await ai.models.generateContent({
                  model: "gemini-1.5-flash",
                  contents: [{
                    parts: [
                      { text: prompt },
                      {
                        inlineData: {
                          data: base64Data,
                          mimeType: "image/jpeg"
                        }
                      }
                    ]
                  }]
                });
              });
              fullOCRText += (response.text || "") + "\n\n";
          } catch (err: any) {
              console.error(`OCR failed for page ${i + 1}:`, err);
              const isQuota = err.message?.includes("429") || err.message?.toLowerCase().includes("quota") || err.message?.includes("RESOURCES_EXHAUSTED");
              
              if (isQuota) {
                if (fullOCRText.length > 50) {
                  console.warn("Returning partial OCR due to quota limit.");
                  break; 
                }
                throw new Error("AI service is temporarily unavailable due to high demand. Please try again later.");
              }

              if (err.message && (err.message.includes("API key") || err.message.includes("403") || err.message.includes("400"))) {
                throw err;
              }
          }
      }

      res.json({ text: fullOCRText.trim() });
    } catch (error: any) {
      console.error("OCR error:", error);
      const isQuota = error.message?.includes("429") || error.message?.toLowerCase().includes("quota") || error.message?.includes("RESOURCES_EXHAUSTED");
      res.status(isQuota ? 429 : 500).json({ 
        error: isQuota 
          ? "AI service is temporarily unavailable due to high demand. Please try again later." 
          : error.message || "Failed to extract text via OCR" 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
