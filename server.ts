import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Cloud Run and deployment environments provide PORT via process.env.PORT, default to 3000
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Serve static assets from public folder (favicon, icons, etc.)
app.use(express.static(path.resolve(__dirname, 'public')));

// Helper to get GoogleGenAI client
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Converts raw 16-bit linear PCM audio buffer to a valid RIFF/WAV audio buffer.
 * Gemini TTS output is typically 24000Hz, 16-bit mono linear PCM.
 */
function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate: number = 24000,
  numChannels: number = 1,
  bitsPerSample: number = 16
): Buffer {
  if (pcmBuffer.length >= 4 && pcmBuffer.toString('ascii', 0, 4) === 'RIFF') {
    return pcmBuffer;
  }
  if (pcmBuffer.length >= 3 && pcmBuffer.toString('ascii', 0, 3) === 'ID3') {
    return pcmBuffer;
  }
  if (pcmBuffer.length >= 2 && pcmBuffer[0] === 0xff && (pcmBuffer[1] & 0xe0) === 0xe0) {
    return pcmBuffer;
  }

  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const wavBuffer = Buffer.alloc(totalSize);

  // 1. RIFF chunk descriptor
  wavBuffer.write('RIFF', 0);
  wavBuffer.writeUInt32LE(totalSize - 8, 4);
  wavBuffer.write('WAVE', 8);

  // 2. "fmt " sub-chunk
  wavBuffer.write('fmt ', 12);
  wavBuffer.writeUInt32LE(16, 16); // Subchunk1Size = 16 for PCM
  wavBuffer.writeUInt16LE(1, 20); // AudioFormat = 1 (PCM)
  wavBuffer.writeUInt16LE(numChannels, 22);
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(byteRate, 28);
  wavBuffer.writeUInt16LE(blockAlign, 32);
  wavBuffer.writeUInt16LE(bitsPerSample, 34);

  // 3. "data" sub-chunk
  wavBuffer.write('data', 36);
  wavBuffer.writeUInt32LE(dataSize, 40);

  // 4. PCM audio samples
  pcmBuffer.copy(wavBuffer, 44);

  return wavBuffer;
}

// In-memory cache for quick preview clips
const previewCache = new Map<string, { audioBase64: string; mimeType: string }>();

/**
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    nodeEnv: process.env.NODE_ENV || 'development',
    port: PORT,
  });
});

/**
 * Endpoint to generate voice from text using Gemini TTS
 */
app.post('/api/tts/generate', async (req: Request, res: Response) => {
  try {
    const {
      text,
      language = 'en',
      voiceName = 'Kore',
      speed = 1.0,
      pitch = 1.0,
      style = '',
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text likhna zaroori hai (Text is required).' });
    }

    if (text.length > 5000) {
      return res.status(400).json({ error: 'Text limit 5000 characters se zyada nahi ho sakti.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY environment variable is not configured. Please ensure your Gemini API key is set in AI Studio Secrets.',
      });
    }

    const ai = getGenAIClient();

    // Build style and pacing instructions for natural speech synthesis
    let paceDescription = 'moderate normal pace';
    if (speed < 0.8) paceDescription = 'deliberate, slow, and clear pace';
    else if (speed > 1.25) paceDescription = 'brisk, fast, and energetic pace';

    let pitchDescription = 'natural balanced pitch';
    if (pitch < 0.8) pitchDescription = 'deep, resonant, and lower-toned pitch';
    else if (pitch > 1.2) pitchDescription = 'higher-pitched, bright tone';

    const languageNames: Record<string, string> = {
      ur: 'Urdu',
      en: 'English',
      hi: 'Hindi',
      ar: 'Arabic',
    };
    const langName = languageNames[language] || 'English';

    const speechStyle = style
      ? `${style}. Spoken clearly in ${langName}, with ${paceDescription} and ${pitchDescription}.`
      : `High-quality studio voiceover spoken naturally and expressively in ${langName}. Clean diction with ${paceDescription} and ${pitchDescription}.`;

    // Try canonical Gemini TTS models
    const modelsToTry = [
      'gemini-2.5-flash-preview-tts',
      'gemini-3.8-flash-lite-tts',
      'gemini-3.8-flash-tts',
    ];

    let lastError: any = null;
    let audioBuffer: Buffer | null = null;
    let detectedMimeType = 'audio/wav';

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: text.trim(),
                  speechMetadata: {
                    style: speechStyle,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName,
                },
              },
            },
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const rawBase64 = part?.inlineData?.data;
        const sourceMime = part?.inlineData?.mimeType || 'audio/pcm;rate=24000';

        if (rawBase64) {
          const rawBuffer = Buffer.from(rawBase64, 'base64');
          let sampleRate = 24000;
          const rateMatch = sourceMime.match(/rate=(\d+)/);
          if (rateMatch && rateMatch[1]) {
            sampleRate = parseInt(rateMatch[1], 10);
          }

          // Convert raw PCM to standard playable WAV with 44-byte RIFF header
          audioBuffer = pcmToWav(rawBuffer, sampleRate, 1, 16);
          detectedMimeType = 'audio/wav';
          break; // Success!
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`TTS attempt with model ${modelName} failed:`, err?.message || err);
      }
    }

    if (!audioBuffer) {
      const errorMessage =
        lastError?.message ||
        'Audio generation failed. Please check your Gemini API key or try again.';
      return res.status(500).json({ error: errorMessage });
    }

    const base64Wav = audioBuffer.toString('base64');
    const audioUrl = `data:${detectedMimeType};base64,${base64Wav}`;

    return res.json({
      success: true,
      audioBase64: base64Wav,
      audioUrl: audioUrl,
      mimeType: detectedMimeType,
      textLength: text.length,
      voiceName,
      language,
      speed,
      pitch,
    });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    return res.status(500).json({
      error: error?.message || 'Server error while generating speech.',
    });
  }
});

/**
 * Endpoint for instant short voice previews
 */
app.post('/api/tts/preview', async (req: Request, res: Response) => {
  try {
    const { voiceName = 'Kore', language = 'en' } = req.body;
    const cacheKey = `${voiceName}_${language}`;

    if (previewCache.has(cacheKey)) {
      const cached = previewCache.get(cacheKey)!;
      return res.json({
        success: true,
        audioUrl: `data:${cached.mimeType};base64,${cached.audioBase64}`,
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not set.' });
    }

    const ai = getGenAIClient();

    // Short greeting phrases tailored to each language
    const samplePhrases: Record<string, string> = {
      ur: 'خوش آمدید! یہ وائس اوور پرو کی آواز کی مثال ہے۔',
      en: 'Hello! This is a preview of VoiceOver Pro text to speech.',
      hi: 'नमस्ते! यह वॉइसओवर प्रो की आवाज़ का एक नमूना है।',
      ar: 'مرحباً بك! هذه معاينة لصوت فويس أوفر برو.',
    };

    const previewText = samplePhrases[language] || samplePhrases.en;
    const modelsToTry = [
      'gemini-2.5-flash-preview-tts',
      'gemini-3.8-flash-lite-tts',
      'gemini-3.8-flash-tts',
    ];

    let audioBuffer: Buffer | null = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [{ text: previewText }],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName },
              },
            },
          },
        });

        const rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (rawBase64) {
          const rawBuffer = Buffer.from(rawBase64, 'base64');
          audioBuffer = pcmToWav(rawBuffer, 24000, 1, 16);
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!audioBuffer) {
      return res.status(500).json({
        error: lastError?.message || 'Could not generate preview clip.',
      });
    }

    const base64Wav = audioBuffer.toString('base64');
    previewCache.set(cacheKey, {
      audioBase64: base64Wav,
      mimeType: 'audio/wav',
    });

    return res.json({
      success: true,
      audioUrl: `data:audio/wav;base64,${base64Wav}`,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Preview generation failed' });
  }
});

// Serve frontend in dev via Vite middlewares, or static in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    try {
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Vite middleware could not be loaded, falling back to static files:', e);
      app.use(express.static(path.resolve(__dirname, 'dist')));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
      });
    }
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VoiceOver Pro server listening on 0.0.0.0:${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
