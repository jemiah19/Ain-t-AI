import React, { useState } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { MemoryItem } from '../types/assistant';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onAddMemory: (key: string, value: string, category: MemoryItem['category']) => void;
  onUpdateMemory: (id: string, key: string, value: string) => void;
  onDeleteMemory: (id: string) => void;
  onClearAllMemories: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onClearAllMemories,
}) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('preference');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    onAddMemory(newKey.trim(), newValue.trim(), newCategory);
    setNewKey('');
    setNewValue('');
    setIsAdding(false);
  };

  const startEdit = (m: MemoryItem) => {
    setEditingId(m.id);
    setEditKey(m.key);
    setEditValue(m.value);
  };

  const saveEdit = (id: string) => {
    if (editKey.trim() && editValue.trim()) {
      onUpdateMemory(id, editKey.trim(), editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0e121f] border border-slate-800 shadow-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-800 bg-[#0a0d18]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Personal Memory System
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  User-Controlled
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Facts and preferences Ain't AI recalls across conversation sessions
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Policy & Privacy Banner */}
        <div className="p-3.5 bg-emerald-950/20 border-b border-emerald-900/30 text-xs text-emerald-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-emerald-200">Memory Policy:</span> Memories are stored locally on your device and injected directly into Ain't AI's system prompt. Ain't AI will never store credentials, tokens, or personal secrets. You can inspect, modify, or erase any memory below at any time.
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Saved Entries ({memories.length})
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Memory</span>
              </button>

              {memories.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-900/40 text-rose-400 hover:bg-rose-950/30 text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* Add New Memory Form */}
          {isAdding && (
            <form
              onSubmit={handleAddSubmit}
              className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/40 space-y-3"
            >
              <div className="font-semibold text-xs text-indigo-300">New Memory Entry</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Topic / Key (e.g. Favorite Language)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-hidden"
                >
                  <option value="preference">Preference</option>
                  <option value="personal_fact">Personal Fact</option>
                  <option value="work">Work & Projects</option>
                  <option value="custom">General</option>
                </select>
              </div>
              <textarea
                rows={2}
                placeholder="Details for Ain't AI to remember..."
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 leading-relaxed"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newKey.trim() || !newValue.trim()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium disabled:opacity-40"
                >
                  Save Entry
                </button>
              </div>
            </form>
          )}

          {/* Memories List */}
          {memories.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs space-y-1">
              <Info className="w-5 h-5 mx-auto mb-1 text-slate-600" />
              <p>No personal memories saved yet.</p>
              <p>Add facts, project rules, or personal preferences you want Ain't AI to remember.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {memories.map((m) => {
                const isEditing = editingId === m.id;

                return (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all text-xs space-y-2"
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editKey}
                          onChange={(e) => setEditKey(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-indigo-500 text-xs text-slate-100"
                        />
                        <textarea
                          rows={2}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-indigo-500 text-xs text-slate-100"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 rounded-sm border border-slate-700 text-[11px] text-slate-400"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEdit(m.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-emerald-600 text-white text-[11px] font-medium"
                          >
                            <Check className="w-3 h-3" /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">{m.key}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-800 text-slate-400 uppercase font-mono">
                              {m.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(m)}
                              className="p-1 text-slate-400 hover:text-slate-200"
                              title="Edit memory"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteMemory(m.id)}
                              className="p-1 text-slate-400 hover:text-rose-400"
                              title="Delete memory"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-300 leading-relaxed break-words">{m.value}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Clear Confirmation Dialog */}
        {showClearConfirm && (
          <div className="p-4 bg-rose-950/90 border-t border-rose-800 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Are you sure you want to permanently erase all memories?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2.5 py-1 rounded-lg border border-rose-700 hover:bg-rose-900/50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllMemories();
                  setShowClearConfirm(false);
                }}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium"
              >
                Yes, Erase
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#090c17] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
