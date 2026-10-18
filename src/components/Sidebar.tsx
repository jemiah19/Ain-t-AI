import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  MessageSquare,
  Trash2,
  Image as ImageIcon,
  Brain,
  Wrench,
  Settings,
  Search,
  Check,
  Edit2,
  X,
  Compass,
} from 'lucide-react';
import { Conversation } from '../types/assistant';
import { AintLogo } from './AintLogo';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  activeView: 'chat' | 'image-studio';
  onNavigateView: (view: 'chat' | 'image-studio') => void;
  onOpenMemoryModal: () => void;
  onOpenToolsModal: () => void;
  onOpenSettingsModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  memoryCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  activeView,
  onNavigateView,
  onOpenMemoryModal,
  onOpenToolsModal,
  onOpenSettingsModal,
  isOpenMobile,
  onCloseMobile,
  memoryCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveEditing = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 bg-[#090c15] border-r border-slate-800/80 text-slate-200 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-sky-400 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className="flex items-center justify-center w-full h-full bg-[#0a0d17] rounded-[11px] p-2">
                <AintLogo className="w-full h-full text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                  Ain't AI
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Ain't
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Personal Assistant</p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => {
              onNewChat();
              onNavigateView('chat');
              onCloseMobile();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          {/* Quick Access to Image Studio */}
          <button
            onClick={() => {
              onNavigateView('image-studio');
              onCloseMobile();
            }}
            className={`flex items-center gap-2.5 w-full py-2 px-3 rounded-xl text-sm font-medium transition-all ${
              activeView === 'image-studio'
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-violet-400" />
            <span>Image Studio</span>
            <span className="ml-auto text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded-sm">
              GenAI
            </span>
          </button>
        </div>

        {/* Conversation Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500/60"
            />
          </div>
        </div>

        {/* Conversations History */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="px-2 py-1 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
            Recent Conversations
          </div>

          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              {searchQuery ? 'No matching chats found.' : 'No conversations yet.'}
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = activeView === 'chat' && c.id === activeConversationId;
              const isEditingThis = editingId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectConversation(c.id);
                    onNavigateView('chat');
                    onCloseMobile();
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-slate-800/90 text-white font-medium border border-slate-700 shadow-xs'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    {isEditingThis ? (
                      <form
                        onSubmit={(e) => saveEditing(c.id, e)}
                        className="flex items-center gap-1 flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-slate-950 px-1.5 py-0.5 rounded-sm border border-indigo-500 text-xs text-slate-100 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={(e) => saveEditing(c.id, e)}
                          className="p-1 hover:text-emerald-400"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <span className="truncate">{c.title}</span>
                    )}
                  </div>

                  {!isEditingThis && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => startEditing(c, e)}
                        className="p-1 text-slate-400 hover:text-slate-200 rounded-sm"
                        title="Rename conversation"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(c.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded-sm"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Capabilities & Controls Section */}
        <div className="p-3 border-t border-slate-800/70 space-y-1 bg-[#070912]">
          <button
            onClick={() => {
              onOpenMemoryModal();
              onCloseMobile();
            }}
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-850 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Brain className="w-4 h-4 text-emerald-400" />
              <span>Personal Memory</span>
            </div>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
              {memoryCount}
            </span>
          </button>

          <button
            onClick={() => {
              onOpenToolsModal();
              onCloseMobile();
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-850 hover:text-white transition-colors"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Tools & Automation</span>
          </button>

          <button
            onClick={() => {
              onOpenSettingsModal();
              onCloseMobile();
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-850 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4 text-sky-400" />
            <span>Settings & Voice</span>
          </button>
        </div>
      </aside>
    </>
  );
};
