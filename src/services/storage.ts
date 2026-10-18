import { Conversation, MemoryItem, GeneratedImage, AssistantSettings } from '../types/assistant';

const STORAGE_KEYS = {
  CONVERSATIONS: 'aint_ai_conversations_v1',
  ACTIVE_CONVERSATION_ID: 'aint_ai_active_conv_v1',
  MEMORIES: 'aint_ai_memories_v1',
  IMAGE_GALLERY: 'aint_ai_images_v1',
  SETTINGS: 'aint_ai_settings_v1',
};

export const DEFAULT_SETTINGS: AssistantSettings = {
  assistantName: "Ain't AI",
  persona: 'balanced',
  customSystemPrompt: '',
  voiceName: 'Kore',
  autoSpeakResponse: false,
  enableGroundingDefault: false,
  enableToolsDefault: true,
  saveMemoriesAutomatically: true,
};

export const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    key: 'Assistant Persona',
    value: "Direct, witty, razor-sharp technical precision with no unnecessary boilerplate or sycophancy.",
    category: 'preference',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'mem-2',
    key: 'Preferred Code Style',
    value: 'Modern TypeScript, concise functional components, clean Tailwind utility classes.',
    category: 'work',
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000,
  },
];

export const storage = {
  getConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch (err) {
      console.warn('Failed to save conversations to localStorage', err);
    }
  },

  getActiveConversationId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
    } catch {
      return null;
    }
  },

  setActiveConversationId(id: string | null): void {
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
      }
    } catch {
      // ignore
    }
  },

  getMemories(): MemoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMORIES);
      if (data) {
        return JSON.parse(data);
      }
      // Initialize with default preferences if fresh
      this.saveMemories(INITIAL_MEMORIES);
      return INITIAL_MEMORIES;
    } catch {
      return INITIAL_MEMORIES;
    }
  },

  saveMemories(memories: MemoryItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
    } catch (err) {
      console.warn('Failed to save memories to localStorage', err);
    }
  },

  getImages(): GeneratedImage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.IMAGE_GALLERY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveImages(images: GeneratedImage[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.IMAGE_GALLERY, JSON.stringify(images));
    } catch (err) {
      console.warn('Failed to save images to localStorage', err);
    }
  },

  getSettings(): AssistantSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AssistantSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.warn('Failed to save settings to localStorage', err);
    }
  },

  clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
      localStorage.removeItem(STORAGE_KEYS.MEMORIES);
      localStorage.removeItem(STORAGE_KEYS.IMAGE_GALLERY);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    } catch {
      // ignore
    }
  },
};
