import React, { useEffect, useRef } from 'react';
import { 
  X, 
  Bot, 
  ShieldCheck, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  ArrowRight, 
  Key, 
  Sparkles, 
  Lock 
} from 'lucide-react';

export default function AgentSystemModal({ isOpen, onClose, agentStatus }) {
  const dialogRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      );
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      }

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
          return;
        }

        if (e.key === 'Tab' && dialogRef.current) {
          const focusables = dialogRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
          );
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isLLMActive = agentStatus?.system?.llmActive;
  const provider = agentStatus?.system?.primaryProvider || 'Deterministic Safe Engine';
  const agents = agentStatus?.agents || [];

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-system-modal-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div ref={dialogRef} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="agent-system-modal-title" className="text-base sm:text-lg font-bold text-white">
                StudyPilot Multi-Agent Architecture
              </h2>
              <p className="text-xs text-slate-400">Autonomous Collaborative Agents & Deterministic Review Guardrails</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            aria-label="Close architecture dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 text-xs text-slate-300">
          {/* Engine Status Banner */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-xl mt-0.5 ${isLLMActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white text-sm block">Active Reasoning Engine</span>
                <span className="text-slate-400 text-xs">
                  {provider}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                isLLMActive 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}>
                {isLLMActive ? 'Online LLM Enabled' : 'Deterministic Academic Engine (Offline Mode)'}
              </span>
            </div>
          </div>

          {/* Implemented Features vs External Credentials Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <h3 className="font-bold text-emerald-400 flex items-center text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Deterministic Academic Engine (Core Syllabus Offline)
              </h3>
              <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                <li>Linear algebra, calculus, algorithms, mechanics & biology conceptual lessons</li>
                <li>Conflict-free timetable slot generator & rest interval checker</li>
                <li>Assignment deadline tracker & milestone breakdown</li>
                <li>Interactive mock quiz simulator & mathematical scoring</li>
                <li>Leitner 5-box spaced repetition flashcard system</li>
                <li>Pomodoro focus timer & persistent session logging</li>
                <li>Full SQLite persistent database storage</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
              <h3 className="font-bold text-indigo-400 flex items-center text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 mr-1.5" />
                Live External LLM Tutoring (Key Connected)
              </h3>
              <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                <li>Open-ended conversational tutoring on university curricula</li>
                <li>Dynamic flashcard deck generation on custom topics</li>
                <li>Custom mock exam generation for specialized exam formats</li>
                <li>Configurable via OpenAI (ChatGPT), Anthropic (Claude), or Google Gemini (100% free key)</li>
              </ul>
            </div>
          </div>

          {/* Workflow Flowchart */}
          <div className="space-y-2">
            <span className="font-bold text-slate-200 uppercase tracking-wider block">
              Multi-Agent Collaboration Pipeline
            </span>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-center text-[11px]">
              <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 font-semibold text-purple-300 flex-1 min-w-[120px]">
                1. Manager Agent
                <span className="block text-[10px] text-slate-400 font-normal">Intent Triage</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 font-semibold text-indigo-300 flex-1 min-w-[120px]">
                2. Specialized Agents
                <span className="block text-[10px] text-slate-400 font-normal">Tutor, Planner, Assignment, Exam</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 font-semibold text-emerald-300 flex-1 min-w-[120px]">
                3. Review Agent
                <span className="block text-[10px] text-slate-400 font-normal">Math & Conflict Audit</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 font-semibold text-white flex-1 min-w-[120px]">
                4. Verified Student Result
                <span className="block text-[10px] text-slate-400 font-normal">Actionable UI</span>
              </div>
            </div>
          </div>

          {/* 6 Specialized Agents Breakdown */}
          <div className="space-y-3">
            <span className="font-bold text-slate-200 uppercase tracking-wider block">
              The 6 Autonomous Agents
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{agent.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {agent.description}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {agent.capabilities?.map((cap, cIdx) => (
                      <span key={cIdx} className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] text-slate-300 border border-slate-800">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}
