import React from 'react';
import { 
  Sparkles, 
  Flame, 
  Timer, 
  MessageSquarePlus, 
  ShieldCheck, 
  Cpu, 
  Layers,
  GraduationCap
} from 'lucide-react';

export default function Navbar({ 
  streak = 0, 
  agentStatus, 
  onOpenSystemModal, 
  onNavigate, 
  currentTab 
}) {
  const isLLMActive = agentStatus?.system?.llmActive;
  const providerLabel = agentStatus?.system?.primaryProvider || 'Deterministic Safe Mode';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Brand & Multi-Agent Tag */}
      <div className="flex items-center space-x-3">
        <div 
          onClick={() => onNavigate('dashboard')} 
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-indigo-300 transition">
                StudyPilot <span className="text-indigo-400">AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Layers className="w-3 h-3 mr-1" />
                6-Agent System
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400">
              Intelligent Multi-Agent Student Assistant
            </p>
          </div>
        </div>
      </div>

      {/* Center/Right Status & Action controls */}
      <div className="flex items-center space-x-2.5 sm:space-x-4">
        {/* Streak counter */}
        <div 
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-amber-400"
          title="Daily Study Streak"
        >
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20" />
          <span>{streak} {streak === 1 ? 'day' : 'days'} streak</span>
        </div>

        {/* Multi-Agent Health Status Button */}
        <button
          onClick={onOpenSystemModal}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 transition"
          title="Inspect Multi-Agent Architecture & Health"
        >
          <div className="relative flex items-center justify-center">
            <span className={`w-2 h-2 rounded-full ${isLLMActive ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
            <span className={`absolute w-3.5 h-3.5 rounded-full animate-ping opacity-40 ${isLLMActive ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
          </div>
          <span className="hidden lg:inline text-slate-300 font-medium">
            {providerLabel}
          </span>
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
        </button>

        {/* Quick Action: Start Focus Timer */}
        <button
          onClick={() => onNavigate('timer')}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition"
        >
          <Timer className="w-3.5 h-3.5 text-indigo-400" />
          <span>Focus Timer</span>
        </button>

        {/* Quick Action: Ask AI Tutor */}
        <button
          onClick={() => onNavigate('chat')}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition transform active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask StudyPilot</span>
        </button>
      </div>
    </header>
  );
}
