import { GroundingSource } from '../types/assistant';

export interface ChatApiRequest {
  messages: Array<{
    role: 'user' | 'model';
    parts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    >;
  }>;
  systemInstruction?: string;
  enableGrounding?: boolean;
}

export interface ChatApiResponse {
  text: string;
  groundingSources?: GroundingSource[];
  usageMetadata?: any;
}

export interface ImageGenerateRequest {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  stylePreset?: string;
}

export interface ImageGenerateResponse {
  dataUrl: string;
  prompt: string;
}

export interface TtsResponse {
  audioBase64: string;
  mimeType: string;
}

export const api = {
  async sendMessage(payload: ChatApiRequest): Promise<ChatApiResponse> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network request failed' }));
      throw new Error(err.error || `Server responded with status ${res.status}`);
    }

    return await res.json();
  },

  async generateImage(payload: ImageGenerateRequest): Promise<ImageGenerateResponse> {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Image generation failed' }));
      throw new Error(err.error || `Server responded with status ${res.status}`);
    }

    return await res.json();
  },

  async generateSpeech(text: string, voiceName: string = 'Kore'): Promise<TtsResponse> {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, voiceName }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'TTS request failed' }));
      throw new Error(err.error || `TTS server error: ${res.status}`);
    }

    return await res.json();
  },

  async checkHealth(): Promise<{ status: string; geminiConfigured: boolean }> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        return await res.json();
      }
      return { status: 'degraded', geminiConfigured: false };
    } catch {
      return { status: 'offline', geminiConfigured: false };
    }
  },
};
