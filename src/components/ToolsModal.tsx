import React, { useState } from 'react';
import {
  Wrench,
  X,
  Play,
  Terminal,
  Calculator,
  ArrowRightLeft,
  Activity,
  Bell,
  Shield,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toolRegistry, ToolDefinition } from '../services/tools';

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestConfirmation: (title: string, message: string, onConfirm: () => void) => void;
}

export const ToolsModal: React.FC<ToolsModalProps> = ({
  isOpen,
  onClose,
  onRequestConfirmation,
}) => {
  const [selectedToolKey, setSelectedToolKey] = useState<string>('calculate');
  const [testInputs, setTestInputs] = useState<Record<string, any>>({
    calculate: { expression: 'Math.sqrt(256) * 12 + Math.pow(2, 8)' },
    convert_units: { value: 100, fromUnit: 'c', toUnit: 'f' },
    code_runner: { code: 'const arr = [1, 2, 3, 4, 5];\nconst sum = arr.reduce((a, b) => a + b, 0);\nconsole.log("Calculated array sum:", sum);' },
    system_diagnostics: { query: 'all' },
    schedule_reminder: { reminderText: 'Review Ain\'t AI Assistant code architecture', delaySeconds: 15 },
  });
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toolList = Object.values(toolRegistry);
  const currentTool = toolRegistry[selectedToolKey];

  const handleRunTool = async () => {
    if (!currentTool) return;

    setError(null);
    setExecutionResult(null);

    const executeAction = async () => {
      setIsExecuting(true);
      try {
        const args = testInputs[selectedToolKey] || {};
        const result = await currentTool.execute(args);
        setExecutionResult(result);
      } catch (err: any) {
        setError(err.message || 'Execution failed');
      } finally {
        setIsExecuting(false);
      }
    };

    if (currentTool.requiresConfirmation) {
      const prompt = currentTool.confirmationPrompt
        ? currentTool.confirmationPrompt(testInputs[selectedToolKey])
        : `Execute ${currentTool.displayName}?`;
      onRequestConfirmation(
        `Approve ${currentTool.displayName}`,
        prompt,
        () => executeAction()
      );
    } else {
      await executeAction();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0e121f] border border-slate-800 shadow-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-800 bg-[#0a0d18]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Controlled Automation & Tool Registry
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Enforced Permissions
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Safe modular integrations that Ain't AI invokes to execute precise tasks
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layout: Master / Detail */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Tools List Nav */}
          <div className="w-full md:w-64 border-r border-slate-800/80 bg-slate-950/40 p-3 space-y-1 overflow-y-auto">
            <div className="text-[11px] font-semibold text-slate-500 uppercase px-2 py-1">
              Registered Tools
            </div>
            {toolList.map((t) => (
              <button
                key={t.name}
                onClick={() => {
                  setSelectedToolKey(t.name);
                  setExecutionResult(null);
                  setError(null);
                }}
                className={`flex items-center justify-between w-full p-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                  selectedToolKey === t.name
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="truncate">
                  <div className="truncate text-slate-200 font-semibold">{t.displayName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{t.name}()</div>
                </div>
                {t.requiresConfirmation && (
                  <span title="Requires user confirmation">
                    <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tool Inspector & Runner */}
          <div className="flex-1 flex flex-col p-4 md:p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {currentTool && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-100 text-sm">{currentTool.displayName}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-slate-800 text-slate-300 border border-slate-700">
                      Category: {currentTool.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{currentTool.description}</p>
                </div>

                {/* Parameters Schema Display */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5 font-mono">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Parameter Schema:
                  </div>
                  <pre className="text-[11px] text-slate-300 overflow-x-auto">
                    {JSON.stringify(currentTool.parameters.properties, null, 2)}
                  </pre>
                </div>

                {/* Live Test Inputs */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">Live Test Arguments</div>
                  {selectedToolKey === 'calculate' && (
                    <input
                      type="text"
                      value={testInputs.calculate.expression}
                      onChange={(e) =>
                        setTestInputs({
                          ...testInputs,
                          calculate: { expression: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono"
                      placeholder="e.g. Math.sqrt(144) * 3"
                    />
                  )}

                  {selectedToolKey === 'convert_units' && (
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={testInputs.convert_units.value}
                        onChange={(e) =>
                          setTestInputs({
                            ...testInputs,
                            convert_units: {
                              ...testInputs.convert_units,
                              value: Number(e.target.value),
                            },
                          })
                        }
                        className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono"
                        placeholder="Value"
                      />
                      <input
                        type="text"
                        value={testInputs.convert_units.fromUnit}
                        onChange={(e) =>
                          setTestInputs({
                            ...testInputs,
                            convert_units: {
                              ...testInputs.convert_units,
                              fromUnit: e.target.value,
                            },
                          })
                        }
                        className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono"
                        placeholder="From (e.g. c)"
                      />
                      <input
                        type="text"
                        value={testInputs.convert_units.toUnit}
                        onChange={(e) =>
                          setTestInputs({
                            ...testInputs,
                            convert_units: {
                              ...testInputs.convert_units,
                              toUnit: e.target.value,
                            },
                          })
                        }
                        className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono"
                        placeholder="To (e.g. f)"
                      />
                    </div>
                  )}

                  {selectedToolKey === 'code_runner' && (
                    <textarea
                      rows={4}
                      value={testInputs.code_runner.code}
                      onChange={(e) =>
                        setTestInputs({
                          ...testInputs,
                          code_runner: { code: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-emerald-300 font-mono leading-relaxed"
                      placeholder="JavaScript code..."
                    />
                  )}

                  {selectedToolKey === 'schedule_reminder' && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={testInputs.schedule_reminder.reminderText}
                        onChange={(e) =>
                          setTestInputs({
                            ...testInputs,
                            schedule_reminder: {
                              ...testInputs.schedule_reminder,
                              reminderText: e.target.value,
                            },
                          })
                        }
                        className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100"
                        placeholder="Reminder message"
                      />
                      <input
                        type="number"
                        value={testInputs.schedule_reminder.delaySeconds}
                        onChange={(e) =>
                          setTestInputs({
                            ...testInputs,
                            schedule_reminder: {
                              ...testInputs.schedule_reminder,
                              delaySeconds: Number(e.target.value),
                            },
                          })
                        }
                        className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono"
                        placeholder="Seconds delay"
                      />
                    </div>
                  )}
                </div>

                {/* Execution Button */}
                <div className="pt-2">
                  <button
                    onClick={handleRunTool}
                    disabled={isExecuting}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isExecuting ? 'Running in Sandbox...' : 'Test Tool Execution'}</span>
                  </button>
                </div>

                {/* Result or Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                {executionResult && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Execution Result (Sanitized Output)</span>
                    </div>
                    <pre className="text-xs text-slate-200 font-mono overflow-x-auto whitespace-pre-wrap">
                      {typeof executionResult === 'object'
                        ? JSON.stringify(executionResult, null, 2)
                        : String(executionResult)}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#090c17] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
