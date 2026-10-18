import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(apiKey),
    nodeEnv: process.env.NODE_ENV || 'development',
  });
});

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: 'Gemini API is not configured on the server. Please check your GEMINI_API_KEY.',
      });
    }

    const { messages, systemInstruction, enableGrounding } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    // Format contents for @google/genai
    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: m.parts.map((part: any) => {
        if (part.inlineData) {
          return {
            inlineData: {
              mimeType: part.inlineData.mimeType,
              data: part.inlineData.data,
            },
          };
        }
        return { text: part.text || '' };
      }),
    }));

    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    if (enableGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    let response: any = null;
    let usedModel = 'gemini-3.8-flash';

    try {
      // Primary attempt with gemini-3.8-flash
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: formattedContents,
        config,
      });
    } catch (primaryErr: any) {
      const isQuotaOrRate =
        primaryErr?.status === 429 ||
        String(primaryErr?.message).includes('429') ||
        String(primaryErr?.message).includes('RESOURCE_EXHAUSTED') ||
        String(primaryErr?.message).includes('quota');

      console.warn(`Primary model gemini-3.8-flash error (isQuota: ${isQuotaOrRate}):`, primaryErr.message);

      if (isQuotaOrRate) {
        // Fallback: Try gemini-3.1-flash-lite (high efficiency, separate rate limits)
        try {
          usedModel = 'gemini-3.1-flash-lite';
          const fallbackConfig: any = {};
          if (systemInstruction) {
            fallbackConfig.systemInstruction = systemInstruction;
          }
          response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: formattedContents,
            config: fallbackConfig,
          });
        } catch (liteErr: any) {
          console.error('Flash-lite fallback also failed:', liteErr);
          throw primaryErr;
        }
      } else {
        throw primaryErr;
      }
    }

    const text = response.text || '';

    // Extract search grounding sources if present
    const groundingSources: Array<{ title: string; url: string }> = [];
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri) {
          groundingSources.push({
            title: chunk.web.title || chunk.web.uri,
            url: chunk.web.uri,
          });
        }
      }
    }

    res.json({
      text,
      groundingSources,
      usedModel,
      usageMetadata: response.usageMetadata,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    const isQuota =
      error?.status === 429 ||
      String(error?.message).includes('429') ||
      String(error?.message).includes('RESOURCE_EXHAUSTED') ||
      String(error?.message).includes('quota');

    if (isQuota) {
      return res.status(429).json({
        error:
          'Rate limit or quota exceeded: You have reached the request limit for your current Gemini API key. Please wait 30 seconds and retry, or select a paid key for higher throughput.',
        isQuotaExceeded: true,
      });
    }

    res.status(500).json({
      error: error.message || 'An error occurred while generating the response.',
    });
  }
});

// Image Generation Endpoint
app.post('/api/generate-image', async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: 'Gemini API is not configured on the server. Please check your GEMINI_API_KEY.',
      });
    }

    const { prompt, aspectRatio = '1:1', stylePreset } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required for image generation.' });
    }

    let finalPrompt = prompt.trim();
    if (stylePreset) {
      finalPrompt = `${finalPrompt}, in ${stylePreset} style, high quality visual composition`;
    }

    const validAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
    const selectedAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';

    // Try AI SVG illustration using Gemini 3.8 Flash for rich, prompt-specific artwork
    try {
      const svgDataUrl = await generateAiSvgIllustration(finalPrompt, selectedAspectRatio);
      return res.json({
        dataUrl: svgDataUrl,
        prompt: finalPrompt,
        engine: 'Gemini Vector Illustrator',
      });
    } catch (svgErr) {
      console.warn('SVG generation failed, trying raster diffusion model:', svgErr);
    }

    // Try diffusion model if available
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: finalPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: selectedAspectRatio as any,
        },
      },
    });

    let foundImage = false;
    let dataUrl = '';

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
        foundImage = true;
        break;
      }
    }

    if (foundImage) {
      return res.json({
        dataUrl,
        prompt: finalPrompt,
        engine: 'Gemini Diffusion',
      });
    }

    throw new Error('Image could not be rendered');
  } catch (error: any) {
    console.error('Image generation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate image. Please try a simpler prompt.',
    });
  }
});

// Helper: Generates a complete, prompt-specific, rich SVG illustration via Gemini
async function generateAiSvgIllustration(prompt: string, aspectRatio: string): Promise<string> {
  let width = 1024;
  let height = 1024;
  if (aspectRatio === '16:9') { width = 1280; height = 720; }
  else if (aspectRatio === '9:16') { width = 720; height = 1280; }
  else if (aspectRatio === '4:3') { width = 1024; height = 768; }
  else if (aspectRatio === '3:4') { width = 768; height = 1024; }

  const systemInstruction = `You are an elite vector artist and SVG illustrator.
Your job is to generate a standalone, complete, beautiful SVG illustration that directly and visually portrays the user's prompt.
CRITICAL MANDATES:
1. Render the EXACT physical subject requested. If the user asks for "an apple that has one bite", draw a full, luscious red apple with 3D-like spherical shading, curved brown stem, green leaf, and a realistic bite taken out of the side with textured crisp white apple flesh and seeds.
2. DO NOT draw abstract templates, generic placeholder circles, triangles, or text cards.
3. Use modern SVG graphics: <defs>, <linearGradient>, <radialGradient>, <filter>, <path>, <ellipse>, organic curves, highlights, cast shadows, and rich color palettes.
4. Canvas dimensions: viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg". Include a complimentary atmospheric background.
5. Return ONLY valid SVG code starting with <svg and ending with </svg>. No markdown formatting, no backticks, no explanations.`;

  const response = await ai!.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: `Create a professional, detailed vector illustration of: ${prompt}` }],
      },
    ],
    config: {
      systemInstruction,
      temperature: 0.7,
    },
  });

  const raw = response.text || '';
  const match = raw.match(/<svg[\s\S]*?<\/svg>/i);
  if (match) {
    const svg = match[0];
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }
  throw new Error('Model did not return valid SVG');
}

// Text-to-Speech Endpoint
app.post('/api/tts', async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API not configured.' });
    }

    const { text, voiceName = 'Kore' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string is required for TTS.' });
    }

    // Limit text length to 1000 characters for snappy TTS responses
    const cleanText = text.slice(0, 1000);

    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const chosenVoice = validVoices.includes(voiceName) ? voiceName : 'Kore';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: cleanText }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: 'Model did not return audio data.' });
    }

    res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message || 'Failed to synthesize speech.' });
  }
});

// Setup Vite middleware or static serving
async function setupServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ain't AI server online at http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
});
