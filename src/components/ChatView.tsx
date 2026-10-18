import React, { useRef, useEffect } from 'react';
import {
  Menu,
  Sparkles,
  Search,
  Code,
  Image as ImageIcon,
  Compass,
  Zap,
} from 'lucide-react';
import { Message, Conversation, Attachment } from '../types/assistant';
import { MessageItem } from './MessageItem';
import { ChatInput } from './ChatInput';
import { AintLogo } from './AintLogo';

interface ChatViewProps {
  conversation: Conversation | null;
  isLoading: boolean;
  onSendMessage: (text: string, attachments: Attachment[], enableSearch: boolean) => void;
  onRetryMessage: () => void;
  onOpenMobileSidebar: () => void;
  voiceName: string;
  enableSearchDefault: boolean;
  onQuickGenerateImage: () => void;
}

const STARTER_PROMPTS = [
  {
    icon: Compass,
    title: 'Search Live Information',
    prompt: "What are the latest breakthroughs and developments in artificial intelligence this week? Please search the web and cite sources.",
    color: 'text-sky-400',
    borderColor: 'hover:border-sky-500/40',
  },
  {
    icon: Code,
    title: 'Code Architecture & Sandbox',
    prompt: "Write a high-performance TypeScript debounce function with immediate execution support and unit test cases.",
    color: 'text-emerald-400',
    borderColor: 'hover:border-emerald-500/40',
  },
  {
    icon: ImageIcon,
    title: 'Create Visual Concept',
    prompt: "Can you generate a futuristic minimalist workspace with glowing ambient indigo and cyan lights in 16:9 aspect ratio?",
    color: 'text-violet-400',
    borderColor: 'hover:border-violet-500/40',
  },
  {
    icon: Zap,
    title: 'Run Controlled Automation',
    prompt: "Evaluate the math formula: (Math.sin(Math.PI/6) * 100) + Math.sqrt(256), and convert 75 miles to kilometers.",
    color: 'text-amber-400',
    borderColor: 'hover:border-amber-500/40',
  },
];

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  isLoading,
  onSendMessage,
  onRetryMessage,
  onOpenMobileSidebar,
  voiceName,
  enableSearchDefault,
  onQuickGenerateImage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = conversation?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isLoading]);

  return (
    <div className="flex flex-col flex-1 h-full min-w-0 bg-[#080a11] text-slate-100 overflow-hidden">
      {/* Conversation Top Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800/70 bg-[#090d18]/70 backdrop-blur-md z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-slate-200 truncate">
              {conversation?.title || 'New Conversation'}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Ain't AI Online
              </span>
              <span>•</span>
              <span className="font-mono text-slate-500">Gemini 3.8</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onQuickGenerateImage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 text-xs font-medium transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">Image Studio</span>
          </button>
        </div>
      </header>

      {/* Main Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center min-h-full p-6 text-center max-w-2xl mx-auto space-y-6">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-sky-400 p-[1.5px] shadow-xl shadow-indigo-600/20">
              <div className="flex items-center justify-center w-full h-full bg-[#090c17] rounded-[15px] p-3">
                <AintLogo className="w-full h-full text-indigo-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                How can <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-sky-300 bg-clip-text text-transparent">Ain't AI</span> help today?
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Direct, multi-turn intelligence with voice synthesis, file analysis, Google search grounding, and AI image generation.
              </p>
            </div>

            {/* Quick Starters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-2">
              {STARTER_PROMPTS.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(card.prompt, [], true)}
                    className={`flex flex-col text-left p-3.5 rounded-2xl bg-[#0f1423]/70 hover:bg-[#13192c] border border-slate-800/80 ${card.borderColor} transition-all duration-200 group shadow-sm`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 ${card.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                        {card.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {card.prompt}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Render Messages */
          <div className="divide-y divide-slate-800/50">
            {messages.map((m, idx) => (
              <MessageItem
                key={m.id}
                message={m}
                voiceName={voiceName}
                onRetry={idx === messages.length - 1 && m.role === 'assistant' ? onRetryMessage : undefined}
                isLast={idx === messages.length - 1}
              />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-3 px-6 py-4 bg-[#0b0e18]/80 text-xs text-slate-400">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-slate-300">
                    <span>Ain't AI is processing</span>
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">Formulating response with full context</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Composer Area */}
      <ChatInput
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        enableSearchDefault={enableSearchDefault}
        onQuickGenerateImage={onQuickGenerateImage}
      />
    </div>
  );
};
