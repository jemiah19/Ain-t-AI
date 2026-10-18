import React, { useState, useEffect, useMemo } from 'react';
import {
  Conversation,
  Message,
  Attachment,
  MemoryItem,
  GeneratedImage,
  AssistantSettings,
} from './types/assistant';
import { storage } from './services/storage';
import { api } from './services/api';
import { toolRegistry } from './services/tools';
import { voiceService } from './services/speech';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { ImageStudio } from './components/ImageStudio';
import { MemoryModal } from './components/MemoryModal';
import { ToolsModal } from './components/ToolsModal';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmationDialog } from './components/ConfirmationDialog';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    storage.getConversations()
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    const saved = storage.getActiveConversationId();
    const all = storage.getConversations();
    if (saved && all.some((c) => c.id === saved)) return saved;
    return all.length > 0 ? all[0].id : null;
  });

  const [memories, setMemories] = useState<MemoryItem[]>(() => storage.getMemories());
  const [images, setImages] = useState<GeneratedImage[]>(() => storage.getImages());
  const [settings, setSettings] = useState<AssistantSettings>(() => storage.getSettings());

  const [activeView, setActiveView] = useState<'chat' | 'image-studio'>('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Confirmation state
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Sync to storage
  useEffect(() => {
    storage.saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    storage.setActiveConversationId(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    storage.saveMemories(memories);
  }, [memories]);

  useEffect(() => {
    storage.saveImages(images);
  }, [images]);

  useEffect(() => {
    storage.saveSettings(settings);
  }, [settings]);

  // Current conversation
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  // Create new conversation
  const handleNewChat = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  };

  // Ensure at least one conversation exists if empty
  useEffect(() => {
    if (conversations.length === 0) {
      handleNewChat();
    }
  }, []);

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (activeConversationId === id) {
        setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Build system prompt based on persona and user memories
  const buildSystemPrompt = () => {
    let personaText = "You are Ain't AI, a sharp, ultra-competent, and direct personal AI assistant.";
    if (settings.persona === 'technical') {
      personaText = "You are Ain't AI, a senior technical architect and systems engineer. Focus on code quality, performance, and concrete solutions.";
    } else if (settings.persona === 'concise') {
      personaText = "You are Ain't AI. Be extremely concise, direct, and minimalist. Do not include conversational filler or pleasantries.";
    } else if (settings.persona === 'creative') {
      personaText = "You are Ain't AI, an imaginative, creative, and evocative AI partner.";
    }

    let memorySection = '';
    if (settings.saveMemoriesAutomatically && memories.length > 0) {
      memorySection = `\n\nUSER PERSONAL MEMORIES & PREFERENCES (Always remember and adhere to these):\n${memories
        .map((m) => `- ${m.key}: ${m.value}`)
        .join('\n')}`;
    }

    return `${personaText}${memorySection}\n\nToday's date is: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. When users ask questions requiring real-time facts, use grounding information when provided.`;
  };

  // Send message
  const handleSendMessage = async (
    text: string,
    attachments: Attachment[],
    enableSearch: boolean
  ) => {
    if (!activeConversation) {
      handleNewChat();
    }

    const currentConvId = activeConversation?.id || `conv-${Date.now()}`;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    // Auto-update conversation title on first message
    let updatedTitle = activeConversation?.title;
    if (
      !activeConversation ||
      activeConversation.messages.length === 0 ||
      activeConversation.title === 'New Conversation'
    ) {
      updatedTitle = text ? text.slice(0, 32).trim() : 'Image Analysis';
    }

    // Add user message to state
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === currentConvId) {
          return {
            ...c,
            title: updatedTitle || c.title,
            updatedAt: Date.now(),
            messages: [...c.messages, userMessage],
          };
        }
        return c;
      })
    );

    setIsLoading(true);

    try {
      // Check for quick inline tool triggers
      const lower = text.toLowerCase().trim();
      if (lower.startsWith('/calc ') || lower.startsWith('calc:')) {
        const expr = text.replace(/^\/(calc|evaluate)\s+/i, '').replace(/^calc:\s*/i, '');
        const res = await toolRegistry.calculate.execute({ expression: expr });
        const assistantMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `The evaluated result for \`${expr}\` is **${res.result}**.`,
          timestamp: Date.now(),
          toolCalls: [{ toolName: 'calculate', args: { expression: expr }, result: res, status: 'success' }],
        };
        appendAssistantMessage(currentConvId, assistantMessage);
        setIsLoading(false);
        return;
      }

      if (lower.startsWith('/convert ')) {
        const parts = text.replace(/^\/convert\s+/i, '').split(' ');
        if (parts.length >= 3) {
          const val = Number(parts[0]);
          const from = parts[1];
          const to = parts[2];
          const res = await toolRegistry.convert_units.execute({ value: val, fromUnit: from, toUnit: to });
          const assistantMessage: Message = {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            content: `Converted **${res.original}** to **${res.converted}**.`,
            timestamp: Date.now(),
            toolCalls: [{ toolName: 'convert_units', args: { value: val, fromUnit: from, toUnit: to }, result: res, status: 'success' }],
          };
          appendAssistantMessage(currentConvId, assistantMessage);
          setIsLoading(false);
          return;
        }
      }

      // Format multi-turn conversation messages for backend
      const convMessages = (activeConversation?.messages || []).concat(userMessage);

      const apiMessages = convMessages.map((m) => {
        const parts: any[] = [];

        // Attach image data if present
        if (m.attachments) {
          for (const att of m.attachments) {
            if (att.mimeType.startsWith('image/')) {
              // Extract base64 part
              const commaIdx = att.dataUrl.indexOf(',');
              const base64Data = commaIdx !== -1 ? att.dataUrl.slice(commaIdx + 1) : att.dataUrl;
              parts.push({
                inlineData: {
                  mimeType: att.mimeType,
                  data: base64Data,
                },
              });
            } else {
              parts.push({
                text: `[Attached File: ${att.name}]\n`,
              });
            }
          }
        }

        if (m.content) {
          parts.push({ text: m.content });
        }

        return {
          role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
          parts,
        };
      });

      const response = await api.sendMessage({
        messages: apiMessages,
        systemInstruction: buildSystemPrompt(),
        enableGrounding: enableSearch,
      });

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response.text || 'I have processed your query.',
        timestamp: Date.now(),
        groundingSources: response.groundingSources && response.groundingSources.length > 0
          ? response.groundingSources
          : undefined,
      };

      appendAssistantMessage(currentConvId, assistantMessage);

      // Auto-read voice if enabled
      if (settings.autoSpeakResponse && response.text) {
        api.generateSpeech(response.text, settings.voiceName).then((tts) => {
          if (tts.audioBase64) {
            voiceService.playBase64Audio(tts.audioBase64, tts.mimeType);
          }
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error('Failed to get AI response:', err);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: err.message || 'An error occurred while contacting the AI service. Please verify server connection.',
        timestamp: Date.now(),
        isError: true,
      };
      appendAssistantMessage(currentConvId, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const appendAssistantMessage = (convId: string, message: Message) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          return {
            ...c,
            updatedAt: Date.now(),
            messages: [...c.messages, message],
          };
        }
        return c;
      })
    );
  };

  const handleRetryLastMessage = () => {
    if (!activeConversation || activeConversation.messages.length === 0) return;
    const msgs = activeConversation.messages;
    const lastUserIdx = msgs.map((m) => m.role).lastIndexOf('user');
    if (lastUserIdx !== -1) {
      const lastUserMsg = msgs[lastUserIdx];
      handleSendMessage(
        lastUserMsg.content,
        lastUserMsg.attachments || [],
        settings.enableGroundingDefault
      );
    }
  };

  // Memory operations
  const handleAddMemory = (key: string, value: string, category: MemoryItem['category']) => {
    const item: MemoryItem = {
      id: `mem-${Date.now()}`,
      key,
      value,
      category,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setMemories((prev) => [item, ...prev]);
  };

  const handleUpdateMemory = (id: string, key: string, value: string) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, key, value, updatedAt: Date.now() } : m))
    );
  };

  const handleDeleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearAllMemories = () => {
    setMemories([]);
  };

  // Export chats
  const handleExportData = () => {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      conversations,
      memories,
      imageCount: images.length,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aint_ai_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearAllChats = () => {
    setConversations([]);
    handleNewChat();
    setIsSettingsOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07090e] font-sans text-slate-100 antialiased selection:bg-indigo-600/30 selection:text-white">
      {/* Responsive Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          setActiveConversationId(id);
          setActiveView('chat');
        }}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        activeView={activeView}
        onNavigateView={(v) => setActiveView(v)}
        onOpenMemoryModal={() => setIsMemoryOpen(true)}
        onOpenToolsModal={() => setIsToolsOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        memoryCount={memories.length}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {activeView === 'chat' ? (
          <ChatView
            conversation={activeConversation}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onRetryMessage={handleRetryLastMessage}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            voiceName={settings.voiceName}
            enableSearchDefault={settings.enableGroundingDefault}
            onQuickGenerateImage={() => setActiveView('image-studio')}
          />
        ) : (
          <ImageStudio
            images={images}
            onSaveImage={(img) => setImages((prev) => [img, ...prev])}
            onDeleteImage={(id) => setImages((prev) => prev.filter((i) => i.id !== id))}
            onBackToChat={() => setActiveView('chat')}
          />
        )}
      </main>

      {/* Modals & Dialogs */}
      <MemoryModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        memories={memories}
        onAddMemory={handleAddMemory}
        onUpdateMemory={handleUpdateMemory}
        onDeleteMemory={handleDeleteMemory}
        onClearAllMemories={handleClearAllMemories}
      />

      <ToolsModal
        isOpen={isToolsOpen}
        onClose={() => setIsToolsOpen(false)}
        onRequestConfirmation={(title, message, onConfirm) => {
          setConfirmation({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
              setConfirmation((prev) => ({ ...prev, isOpen: false }));
              onConfirm();
            },
          });
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        onExportData={handleExportData}
        onClearAllChats={handleClearAllChats}
      />

      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        onConfirm={confirmation.onConfirm}
        onCancel={() => setConfirmation((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
