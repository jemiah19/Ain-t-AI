import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Globe,
  Sparkles,
  X,
  FileText,
  Image as ImageIcon,
  StopCircle,
} from 'lucide-react';
import { Attachment } from '../types/assistant';
import { voiceService } from '../services/speech';

interface ChatInputProps {
  onSendMessage: (text: string, attachments: Attachment[], enableSearch: boolean) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
  enableSearchDefault: boolean;
  onQuickGenerateImage: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onStopGeneration,
  enableSearchDefault,
  onQuickGenerateImage,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [enableSearch, setEnableSearch] = useState(enableSearchDefault);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!text.trim() && attachments.length === 0) || isLoading) return;

    if (isRecording) {
      voiceService.stopListening();
      setIsRecording(false);
    }

    onSendMessage(text.trim(), attachments, enableSearch);
    setText('');
    setAttachments([]);
    setRecordingError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Size limit: 20MB
      if (file.size > 20 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 20MB limit.`);
        continue;
      }

      const reader = new FileReader();
      const readPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

      reader.readAsDataURL(file);
      try {
        const dataUrl = await readPromise;
        newAttachments.push({
          id: `att-${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl,
          mimeType: file.type || 'application/octet-stream',
        });
      } catch (err) {
        console.error('Failed to read file', err);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleToggleVoice = () => {
    setRecordingError(null);

    if (isRecording) {
      voiceService.stopListening();
      setIsRecording(false);
      return;
    }

    const started = voiceService.startListening({
      onStart: () => setIsRecording(true),
      onResult: (transcript) => {
        // Append or set transcript into the text area for review/editing before sending!
        setText(transcript);
      },
      onError: (err) => {
        setRecordingError(err);
        setIsRecording(false);
      },
      onEnd: () => setIsRecording(false),
    });

    if (!started) {
      setIsRecording(false);
    }
  };

  return (
    <div className="p-3 md:p-4 bg-[#080b13] border-t border-slate-800/80">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Recording Status or Error Alert */}
        {isRecording && (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-violet-950/40 border border-violet-700/50 text-violet-300 text-xs animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-medium">Listening... speak into your microphone</span>
            </div>
            <button
              onClick={handleToggleVoice}
              className="text-xs text-violet-300 hover:text-white underline font-medium"
            >
              Finish Recording
            </button>
          </div>
        )}

        {recordingError && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs">
            <span>{recordingError}</span>
            <button onClick={() => setRecordingError(null)} className="p-0.5 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Selected Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative flex items-center gap-2 p-1.5 pr-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
              >
                {att.mimeType.startsWith('image/') ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="w-8 h-8 object-cover rounded-md"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <FileText className="w-4 h-4 text-slate-400" />
                )}
                <span className="truncate max-w-[120px] font-medium">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Card Container */}
        <div className="relative rounded-2xl bg-[#0f1423] border border-slate-800 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/30 shadow-xl transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? 'Transcribing your speech in real-time...'
                : "Ask Ain't AI anything, attach images/code, or search..."
            }
            className="w-full px-4 pt-3 pb-2 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-hidden leading-relaxed"
          />

          {/* Bottom Toolbar inside the input card */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-800/40 text-xs">
            <div className="flex items-center gap-1 sm:gap-2">
              {/* File Attachment Button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.md,.json,.csv,.ts,.tsx,.js,.py"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition-colors"
                title="Attach image or file"
              >
                <Paperclip className="w-4 h-4" />
                <span className="hidden sm:inline">Attach</span>
              </button>

              {/* Web Search Grounding Toggle */}
              <button
                type="button"
                onClick={() => setEnableSearch((prev) => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                  enableSearch
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
                title="Google Web Search Grounding"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </button>

              {/* Quick Image Studio Trigger */}
              <button
                type="button"
                onClick={onQuickGenerateImage}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-violet-900/20 transition-colors"
                title="Open Image Studio"
              >
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="hidden sm:inline">Create Image</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Voice Input Microphone */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`p-2 rounded-xl transition-all ${
                  isRecording
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500 animate-pulse'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
                title={isRecording ? 'Stop recording voice' : 'Speak with microphone'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Stop Generation or Send Button */}
              {isLoading ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors border border-slate-700"
                  title="Stop generating"
                >
                  <StopCircle className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!text.trim() && attachments.length === 0}
                  className="flex items-center justify-center p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-indigo-600/30 transition-all active:scale-95"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
          <span>Shift+Enter for newline</span>
          <span>Powered by Gemini 3.8 & Google Search Grounding</span>
        </div>
      </div>
    </div>
  );
};
