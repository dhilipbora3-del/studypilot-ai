import React, { useState } from 'react';
import { 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ChevronDown, 
  ChevronRight, 
  ShieldCheck, 
  Layers, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function AgentTraceViewer({ traces = [], reviewSummary = null, executionTimeMs = 0, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!traces || traces.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-indigo-500/20 bg-slate-900/80 overflow-hidden shadow-sm">
      {/* Header bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-800/60 hover:bg-slate-800 transition text-left text-xs font-medium text-slate-300"
      >
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-200">Multi-Agent Orchestration Trace</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {traces.length} steps executed
          </span>
          {executionTimeMs > 0 && (
            <span className="flex items-center text-slate-400 text-[11px] ml-1">
              <Clock className="w-3 h-3 mr-1" />
              {executionTimeMs}ms
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {reviewSummary?.verified ? (
            <span className="flex items-center text-emerald-400 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Review Agent Verified
            </span>
          ) : reviewSummary?.warnings?.length > 0 ? (
            <span className="flex items-center text-amber-400 text-[11px] font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              Advisory Flagged
            </span>
          ) : null}
          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded Trace Timeline */}
      {isOpen && (
        <div className="p-4 space-y-3 bg-slate-950/60 text-xs">
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-500/20">
            {traces.map((trace, idx) => {
              const isReview = trace.agent?.toLowerCase().includes('review');
              const isManager = trace.agent?.toLowerCase().includes('manager');
              
              let badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
              if (isReview) {
                badgeColor = trace.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30';
              } else if (isManager) {
                badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
              }

              return (
                <div key={idx} className="relative group">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[19px] top-1 w-3 h-3 rounded-full border-2 ${
                    isReview ? 'border-emerald-400 bg-slate-900' : 'border-indigo-400 bg-slate-900'
                  }`} />

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700 transition">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                          {trace.agent}
                        </span>
                        <span className="text-slate-400 text-[11px]">{trace.role}</span>
                      </div>
                      <span className="text-slate-500 text-[10px] font-mono">
                        {trace.executionTimeMs}ms
                      </span>
                    </div>

                    <p className="text-slate-300 font-medium text-xs mb-1">
                      {trace.action}
                    </p>

                    {trace.details && (
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {trace.details}
                      </p>
                    )}

                    {/* Detailed Review Agent Checks if present */}
                    {trace.checks && trace.checks.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Deterministic Verification Results:
                        </span>
                        {trace.checks.map((c, cIdx) => (
                          <div key={cIdx} className="flex items-start space-x-1.5 text-[11px]">
                            {c.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            )}
                            <span className="text-slate-300">
                              <strong className="text-slate-200">{c.name}:</strong> {c.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
