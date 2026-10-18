export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string; // Base64 data URL
  mimeType: string;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ToolCallRecord {
  toolName: string;
  args: Record<string, any>;
  result?: any;
  status: 'pending' | 'success' | 'failed' | 'requires_confirmation';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  groundingSources?: GroundingSource[];
  toolCalls?: ToolCallRecord[];
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category: 'preference' | 'personal_fact' | 'work' | 'custom';
  createdAt: number;
  updatedAt: number;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  aspectRatio: string;
  stylePreset?: string;
  dataUrl: string;
  createdAt: number;
  revisedPrompt?: string;
}

export interface AssistantSettings {
  assistantName: string;
  persona: 'balanced' | 'creative' | 'technical' | 'concise';
  customSystemPrompt: string;
  voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  autoSpeakResponse: boolean;
  enableGroundingDefault: boolean;
  enableToolsDefault: boolean;
  saveMemoriesAutomatically: boolean;
}
