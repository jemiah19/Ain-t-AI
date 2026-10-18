import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  X,
  Volume2,
  Brain,
  Globe,
  Download,
  Trash2,
  Check,
  Server,
  Sparkles,
} from 'lucide-react';
import { AssistantSettings } from '../types/assistant';
import { api } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AssistantSettings;
  onSaveSettings: (settings: AssistantSettings) => void;
  onExportData: () => void;
  onClearAllChats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onExportData,
  onClearAllChats,
}) => {
  const [localSettings, setLocalSettings] = useState<AssistantSettings>(settings);
  const [serverStatus, setServerStatus] = useState<{ status: string; geminiConfigured: boolean } | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
    if (isOpen) {
      api.checkHealth().then(setServerStatus).catch(() => {
        setServerStatus({ status: 'unreachable', geminiConfigured: false });
      });
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0e121f] border border-slate-800 shadow-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-800 bg-[#0a0d18]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Assistant Settings</h2>
              <p className="text-xs text-slate-400">Configure Ain't AI voice, behavior, and storage</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-800 text-xs">
          {/* Server Connection Telemetry */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-slate-400" />
              <div>
                <div className="font-semibold text-slate-200">Server & Gemini Engine</div>
                <div className="text-[11px] text-slate-400">
                  {serverStatus?.geminiConfigured
                    ? 'Connected via Secure Server API (Gemini 3.8 Flash)'
                    : 'Backend initializing...'}
                </div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                serverStatus?.geminiConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {serverStatus?.geminiConfigured ? 'ONLINE' : 'CONNECTING'}
            </span>
          </div>

          {/* Personality & Persona */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] block">
              Assistant Personality
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'balanced', label: 'Balanced & Direct', desc: 'Precise, objective, and clear' },
                { id: 'technical', label: 'Technical Engineer', desc: 'Code-first, detailed analysis' },
                { id: 'concise', label: 'Minimalist & Fast', desc: 'Short answers, zero fluff' },
                { id: 'creative', label: 'Creative & Visionary', desc: 'Brainstorming, ideation' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, persona: p.id as any })}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    localSettings.persona === p.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-medium text-slate-200">{p.label}</div>
                  <div className="text-[10px] text-slate-500">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Preferences */}
          <div className="space-y-3 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
            <div className="flex items-center gap-2 font-semibold text-slate-300">
              <Volume2 className="w-4 h-4 text-violet-400" />
              <span>Voice Synthesis Settings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Prebuilt Voice</label>
                <select
                  value={localSettings.voiceName}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, voiceName: e.target.value as any })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-hidden"
                >
                  <option value="Kore">Kore (Balanced & Warm)</option>
                  <option value="Puck">Puck (Energetic & Expressive)</option>
                  <option value="Fenrir">Fenrir (Deep & Resonant)</option>
                  <option value="Zephyr">Zephyr (Calm & Soothing)</option>
                  <option value="Charon">Charon (Authoritative)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-4">
                <span className="text-slate-300">Auto-speak assistant responses</span>
                <input
                  type="checkbox"
                  checked={localSettings.autoSpeakResponse}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, autoSpeakResponse: e.target.checked })
                  }
                  className="w-4 h-4 rounded-sm accent-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Web Search & Grounding */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-sky-400" />
              <div>
                <div className="font-medium text-slate-200">Google Web Search Grounding</div>
                <div className="text-[11px] text-slate-400">Search the live web by default on new chats</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.enableGroundingDefault}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, enableGroundingDefault: e.target.checked })
              }
              className="w-4 h-4 rounded-sm accent-sky-500"
            />
          </div>

          {/* Memory Integration */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Brain className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="font-medium text-slate-200">Auto-inject Personal Memories</div>
                <div className="text-[11px] text-slate-400">Recall your saved facts and preferences in chat</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.saveMemoriesAutomatically}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, saveMemoriesAutomatically: e.target.checked })
              }
              className="w-4 h-4 rounded-sm accent-emerald-500"
            />
          </div>

          {/* Data Management */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Data Management
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onExportData}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All Chats (JSON)</span>
              </button>
              <button
                type="button"
                onClick={onClearAllChats}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-900/50 text-rose-400 hover:bg-rose-950/40 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Chat History</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#090c17] flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Ain't AI v1.0.0</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md shadow-indigo-600/20"
            >
              {savedFeedback ? <Check className="w-4 h-4 text-emerald-300" /> : null}
              <span>{savedFeedback ? 'Saved!' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
