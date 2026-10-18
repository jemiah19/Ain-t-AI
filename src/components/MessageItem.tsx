import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCw,
  Volume2,
  VolumeX,
  ExternalLink,
  FileText,
  AlertCircle,
  Terminal,
  Calculator,
  Compass,
} from 'lucide-react';
import { Message, GroundingSource, Attachment } from '../types/assistant';
import { voiceService } from '../services/speech';
import { api } from '../services/api';
import { AintLogo } from './AintLogo';

interface MessageItemProps {
  message: Message;
  voiceName: string;
  onRetry?: () => void;
  isLast?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  voiceName,
  onRetry,
  isLast,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleToggleVoice = async () => {
    if (isPlayingAudio) {
      voiceService.stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }

    setIsAudioLoading(true);
    try {
      // First try Gemini 3.8 Flash Lite TTS endpoint
      const res = await api.generateSpeech(message.content, voiceName);
      if (res.audioBase64) {
        setIsAudioLoading(false);
        setIsPlayingAudio(true);
        await voiceService.playBase64Audio(res.audioBase64, res.mimeType);
        setIsPlayingAudio(false);
        return;
      }
    } catch (err) {
      console.warn('Backend TTS failed, falling back to browser synthesis:', err);
    }

    // Fallback to browser SpeechSynthesis
    try {
      setIsAudioLoading(false);
      setIsPlayingAudio(true);
      await voiceService.speakBrowserFallback(message.content);
    } catch {
      // ignore
    } finally {
      setIsPlayingAudio(false);
      setIsAudioLoading(false);
    }
  };

  // Helper to render basic markdown-like formatting (code blocks, bold, lists, paragraphs)
  const renderFormattedContent = (text: string) => {
    if (!text) return null;

    // Split code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const language = lines[0]?.trim() || 'code';
        const codeContent = (lines.length > 1 ? lines.slice(1).join('\n') : lines.join('\n')).trim();

        return (
          <div key={index} className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-[#07090f] text-xs font-mono shadow-md">
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">{language}</span>
              <button
                onClick={() => navigator.clipboard.writeText(codeContent)}
                className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                title="Copy code"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-3.5 overflow-x-auto text-emerald-300/95 leading-relaxed selection:bg-indigo-600/30">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }

      // Render standard paragraph with basic inline bold and inline code
      const paragraphs = part.split(/\n\n+/);
      return (
        <div key={index} className="space-y-2">
          {paragraphs.map((p, pIdx) => {
            if (!p.trim()) return null;

            // Handle bullet items
            if (p.trim().startsWith('- ') || p.trim().startsWith('* ')) {
              const items = p.split(/\n/).filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '));
              return (
                <ul key={pIdx} className="list-disc list-inside space-y-1 my-1.5 text-slate-200 pl-1">
                  {items.map((item, itemIdx) => (
                    <li key={itemIdx} className="leading-relaxed">
                      {item.replace(/^[-*]\s+/, '')}
                    </li>
                  ))}
                </ul>
              );
            }

            return (
              <p key={pIdx} className="leading-relaxed whitespace-pre-wrap text-slate-200">
                {p}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div
      className={`group flex gap-3 px-4 py-4 md:px-6 transition-colors ${
        isAssistant ? 'bg-[#0b0e18]/80' : 'bg-transparent'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {isAssistant ? (
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-md shadow-indigo-600/20 text-white p-1.5">
            <AintLogo className="w-full h-full text-indigo-100" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Message Content Container */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Author & Timestamp */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">
            {isAssistant ? "Ain't AI" : 'You'}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Attachments Preview (if any) */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 pb-2">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 max-w-xs"
              >
                {att.mimeType.startsWith('image/') ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="w-10 h-10 object-cover rounded-md border border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="p-2 rounded-md bg-slate-800 text-slate-400">
                    <FileText className="w-4 h-4" />
                  </div>
                )}
                <div className="truncate min-w-0">
                  <div className="truncate font-medium text-slate-200">{att.name}</div>
                  <div className="text-[10px] text-slate-500">{(att.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message Body */}
        {message.isError ? (
          message.content.toLowerCase().includes('quota') ||
          message.content.includes('429') ||
          message.content.includes('RESOURCE_EXHAUSTED') ? (
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/40 text-amber-200 text-xs space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Gemini API Quota Exceeded (429)</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Rate Limited
                </span>
              </div>
              <p className="leading-relaxed text-amber-200/90">
                You have reached the per-minute or daily quota for your current Gemini API key. Free-tier requests reset every 60 seconds.
              </p>
              <div className="flex items-center gap-2 pt-1">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Retry Request Now</span>
                  </button>
                )}
                <span className="text-[11px] text-amber-400/80">
                  Tip: Wait ~30 seconds for the quota window to reset.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-rose-200">Request Failed</div>
                <div className="leading-relaxed">{message.content}</div>
              </div>
            </div>
          )
        ) : (
          <div className="text-sm prose-invert break-words text-slate-200 selection:bg-indigo-600/40">
            {renderFormattedContent(message.content)}
          </div>
        )}

        {/* Tool Invocations Card */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="my-2 space-y-2">
            {message.toolCalls.map((tc, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#080b14] border border-amber-500/20 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-amber-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Automated Tool: {tc.toolName}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm bg-amber-500/10 border border-amber-500/20">
                    {tc.status}
                  </span>
                </div>
                {tc.result && (
                  <pre className="p-2 rounded-lg bg-slate-950 font-mono text-slate-300 text-[11px] overflow-x-auto">
                    {typeof tc.result === 'object' ? JSON.stringify(tc.result, null, 2) : String(tc.result)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Web Search Grounding Citations */}
        {message.groundingSources && message.groundingSources.length > 0 && (
          <div className="pt-2 border-t border-slate-800/70">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Verified Web Sources ({message.groundingSources.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.groundingSources.map((source, sIdx) => {
                let domain = '';
                try {
                  domain = new URL(source.url).hostname.replace('www.', '');
                } catch {
                  domain = 'Web Source';
                }

                return (
                  <a
                    key={sIdx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-sky-300 transition-colors"
                  >
                    <span className="truncate max-w-[160px] font-medium">{source.title || domain}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center gap-2 pt-1 text-slate-400">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] hover:text-slate-200 p-1 rounded-md transition-colors"
            title="Copy response"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {isAssistant && (
            <button
              onClick={handleToggleVoice}
              disabled={isAudioLoading}
              className={`flex items-center gap-1 text-[11px] p-1 rounded-md transition-colors ${
                isPlayingAudio ? 'text-indigo-400' : 'hover:text-slate-200'
              }`}
              title={isPlayingAudio ? 'Stop readout' : 'Read aloud with voice'}
            >
              {isAudioLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              ) : isPlayingAudio ? (
                <VolumeX className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isAudioLoading ? 'Synthesizing...' : isPlayingAudio ? 'Stop Voice' : 'Speak'}
              </span>
            </button>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 text-[11px] hover:text-slate-200 p-1 rounded-md transition-colors"
              title="Regenerate / Retry response"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Retry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
