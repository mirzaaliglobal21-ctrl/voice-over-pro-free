// server.ts
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT || 3e3;
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.resolve(__dirname, "public")));
var ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
function pcmToWav(pcmBuffer, sampleRate = 24e3, numChannels = 1, bitsPerSample = 16) {
  if (pcmBuffer.length >= 4 && pcmBuffer.toString("ascii", 0, 4) === "RIFF") {
    return pcmBuffer;
  }
  if (pcmBuffer.length >= 3 && pcmBuffer.toString("ascii", 0, 3) === "ID3") {
    return pcmBuffer;
  }
  if (pcmBuffer.length >= 2 && pcmBuffer[0] === 255 && (pcmBuffer[1] & 224) === 224) {
    return pcmBuffer;
  }
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmBuffer.length;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const wavBuffer = Buffer.alloc(totalSize);
  wavBuffer.write("RIFF", 0);
  wavBuffer.writeUInt32LE(totalSize - 8, 4);
  wavBuffer.write("WAVE", 8);
  wavBuffer.write("fmt ", 12);
  wavBuffer.writeUInt32LE(16, 16);
  wavBuffer.writeUInt16LE(1, 20);
  wavBuffer.writeUInt16LE(numChannels, 22);
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(byteRate, 28);
  wavBuffer.writeUInt16LE(blockAlign, 32);
  wavBuffer.writeUInt16LE(bitsPerSample, 34);
  wavBuffer.write("data", 36);
  wavBuffer.writeUInt32LE(dataSize, 40);
  pcmBuffer.copy(wavBuffer, 44);
  return wavBuffer;
}
var previewCache = /* @__PURE__ */ new Map();
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});
app.post("/api/tts/generate", async (req, res) => {
  try {
    const {
      text,
      language = "en",
      voiceName = "Kore",
      speed = 1,
      pitch = 1,
      style = ""
    } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text likhna zaroori hai (Text is required)." });
    }
    if (text.length > 5e3) {
      return res.status(400).json({ error: "Text limit 5000 characters se zyada nahi ho sakti." });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured on the server."
      });
    }
    let paceDescription = "moderate normal pace";
    if (speed < 0.8) paceDescription = "deliberate, slow, and clear pace";
    else if (speed > 1.25) paceDescription = "brisk, fast, and energetic pace";
    let pitchDescription = "natural balanced pitch";
    if (pitch < 0.8) pitchDescription = "deep, resonant, and lower-toned pitch";
    else if (pitch > 1.2) pitchDescription = "higher-pitched, bright tone";
    const languageNames = {
      ur: "Urdu",
      en: "English",
      hi: "Hindi",
      ar: "Arabic"
    };
    const langName = languageNames[language] || "English";
    const speechStyle = style ? `${style}. Spoken clearly in ${langName}, with ${paceDescription} and ${pitchDescription}.` : `High-quality studio voiceover spoken naturally and expressively in ${langName}. Clean diction with ${paceDescription} and ${pitchDescription}.`;
    const modelsToTry = [
      "gemini-2.5-flash-preview-tts",
      "gemini-3.8-flash-lite-tts",
      "gemini-3.8-flash-tts"
    ];
    let lastError = null;
    let audioBuffer = null;
    let detectedMimeType = "audio/wav";
    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: text.trim(),
                  speechMetadata: {
                    style: speechStyle
                  }
                }
              ]
            }
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName
                }
              }
            }
          }
        });
        const part = response.candidates?.[0]?.content?.parts?.[0];
        const rawBase64 = part?.inlineData?.data;
        const sourceMime = part?.inlineData?.mimeType || "audio/pcm;rate=24000";
        if (rawBase64) {
          const rawBuffer = Buffer.from(rawBase64, "base64");
          let sampleRate = 24e3;
          const rateMatch = sourceMime.match(/rate=(\d+)/);
          if (rateMatch && rateMatch[1]) {
            sampleRate = parseInt(rateMatch[1], 10);
          }
          audioBuffer = pcmToWav(rawBuffer, sampleRate, 1, 16);
          detectedMimeType = "audio/wav";
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`TTS attempt with model ${modelName} failed:`, err?.message || err);
      }
    }
    if (!audioBuffer) {
      const errorMessage = lastError?.message || "Audio generation failed. Please check your Gemini API key or try again.";
      return res.status(500).json({ error: errorMessage });
    }
    const base64Wav = audioBuffer.toString("base64");
    const audioUrl = `data:${detectedMimeType};base64,${base64Wav}`;
    return res.json({
      success: true,
      audioBase64: base64Wav,
      audioUrl,
      mimeType: detectedMimeType,
      textLength: text.length,
      voiceName,
      language,
      speed,
      pitch
    });
  } catch (error) {
    console.error("Error generating TTS:", error);
    return res.status(500).json({
      error: error?.message || "Server error while generating speech."
    });
  }
});
app.post("/api/tts/preview", async (req, res) => {
  try {
    const { voiceName = "Kore", language = "en" } = req.body;
    const cacheKey = `${voiceName}_${language}`;
    if (previewCache.has(cacheKey)) {
      const cached = previewCache.get(cacheKey);
      return res.json({
        success: true,
        audioUrl: `data:${cached.mimeType};base64,${cached.audioBase64}`
      });
    }
    const samplePhrases = {
      ur: "\u062E\u0648\u0634 \u0622\u0645\u062F\u06CC\u062F! \u06CC\u06C1 \u0648\u0627\u0626\u0633 \u0627\u0648\u0648\u0631 \u067E\u0631\u0648 \u06A9\u06CC \u0622\u0648\u0627\u0632 \u06A9\u06CC \u0645\u062B\u0627\u0644 \u06C1\u06D2\u06D4",
      en: "Hello! This is a preview of VoiceOver Pro text to speech.",
      hi: "\u0928\u092E\u0938\u094D\u0924\u0947! \u092F\u0939 \u0935\u0949\u0907\u0938\u0913\u0935\u0930 \u092A\u094D\u0930\u094B \u0915\u0940 \u0906\u0935\u093E\u091C\u093C \u0915\u093E \u090F\u0915 \u0928\u092E\u0942\u0928\u093E \u0939\u0948\u0964",
      ar: "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643! \u0647\u0630\u0647 \u0645\u0639\u0627\u064A\u0646\u0629 \u0644\u0635\u0648\u062A \u0641\u0648\u064A\u0633 \u0623\u0648\u0641\u0631 \u0628\u0631\u0648."
    };
    const previewText = samplePhrases[language] || samplePhrases.en;
    const modelsToTry = [
      "gemini-2.5-flash-preview-tts",
      "gemini-3.8-flash-lite-tts",
      "gemini-3.8-flash-tts"
    ];
    let audioBuffer = null;
    let lastError = null;
    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [{ text: previewText }]
            }
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName }
              }
            }
          }
        });
        const rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (rawBase64) {
          const rawBuffer = Buffer.from(rawBase64, "base64");
          audioBuffer = pcmToWav(rawBuffer, 24e3, 1, 16);
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }
    if (!audioBuffer) {
      return res.status(500).json({
        error: lastError?.message || "Could not generate preview clip."
      });
    }
    const base64Wav = audioBuffer.toString("base64");
    previewCache.set(cacheKey, {
      audioBase64: base64Wav,
      mimeType: "audio/wav"
    });
    return res.json({
      success: true,
      audioUrl: `data:audio/wav;base64,${base64Wav}`
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Preview generation failed" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`VoiceOver Pro server listening on port ${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
