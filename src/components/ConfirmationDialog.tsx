import React from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Approve & Execute',
  cancelLabel = 'Cancel Action',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-[#0f1422] border border-amber-500/30 shadow-2xl p-6 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-amber-300">{title}</h3>
              <p className="text-xs text-slate-400">Security & Permission Gate</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-300 font-mono break-words leading-relaxed">
          {message}
        </div>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Ain't AI enforces user confirmation before executing consequential automation, sandbox code, or system actions.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm font-medium text-slate-300 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition-all shadow-lg shadow-amber-500/20"
          >
            <ShieldCheck className="w-4 h-4" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
