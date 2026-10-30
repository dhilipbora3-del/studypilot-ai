import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Flame, 
  Timer, 
  MessageSquarePlus, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  GraduationCap, 
  User, 
  LogOut, 
  ChevronDown 
} from 'lucide-react';

export default function Navbar({ 
  streak = 0, 
  agentStatus, 
  currentUser, 
  onOpenSystemModal, 
  onOpenAuthModal, 
  onLogout, 
  onNavigate, 
  currentTab 
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isLLMActive = agentStatus?.system?.llmActive;
  const providerLabel = agentStatus?.system?.primaryProvider || 'Deterministic Safe Mode';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUserMenu]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-2 sm:px-5 py-2 sm:py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 w-full max-w-full">
      {/* Brand & Multi-Agent Tag */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink min-w-0">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')} 
          className="flex items-center space-x-1.5 sm:space-x-2.5 cursor-pointer group text-left min-h-[44px] min-w-[44px]"
          aria-label="StudyPilot AI Dashboard Home"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform shrink-0">
            <GraduationCap className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-extrabold text-xs sm:text-base tracking-tight text-white group-hover:text-indigo-300 transition truncate max-w-[70px] xs:max-w-none">
                StudyPilot <span className="text-indigo-400">AI</span>
              </span>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                <Layers className="w-3 h-3 mr-1" />
                6-Agent System
              </span>
            </div>
            <p className="hidden lg:block text-[11px] text-slate-400 truncate">
              Intelligent Multi-Agent Student Assistant
            </p>
          </div>
        </button>
      </div>

      {/* Center/Right Status & Action controls */}
      <div className="flex items-center space-x-1 sm:space-x-3 shrink-0">
        {/* Streak counter */}
        <div 
          className="flex items-center space-x-1 px-1.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-amber-400 shrink-0 min-h-[44px]"
          title="Daily Study Streak"
          aria-label={`Study streak: ${streak} days`}
        >
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20 shrink-0" />
          <span className="hidden sm:inline">{streak} {streak === 1 ? 'day' : 'days'} streak</span>
          <span className="sm:hidden font-bold">{streak}d</span>
        </div>

        {/* Multi-Agent Health Status Button */}
        <button
          type="button"
          onClick={onOpenSystemModal}
          className="flex items-center justify-center space-x-1 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 transition shrink-0 min-h-[44px] min-w-[44px]"
          title="Inspect Multi-Agent Architecture & Health"
          aria-label="Inspect Multi-Agent Architecture and Health"
        >
          <div className="relative flex items-center justify-center shrink-0">
            <span className={`w-2 h-2 rounded-full ${isLLMActive ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
            <span className={`absolute w-3.5 h-3.5 rounded-full animate-ping opacity-40 ${isLLMActive ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
          </div>
          <span className="hidden xl:inline text-slate-300 font-medium">
            {providerLabel}
          </span>
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
        </button>

        {/* User Account / Profile Dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label={`User account: ${currentUser?.name || 'Student'}`}
            aria-haspopup="true"
            aria-expanded={showUserMenu}
            className="flex items-center space-x-1 px-1.5 sm:px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs transition min-h-[44px] min-w-[44px] justify-center"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <span className="hidden md:inline font-semibold text-white max-w-[80px] truncate">
              {currentUser?.name || 'Account'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline shrink-0" />
          </button>

          {showUserMenu && (
            <div 
              role="menu"
              className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1 text-xs z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3.5 py-2 border-b border-slate-800">
                <span className="font-bold text-white block truncate">{currentUser?.name || 'Student'}</span>
                <span className="text-[11px] text-slate-400 block truncate">{currentUser?.email || ''}</span>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => { setShowUserMenu(false); onOpenAuthModal(); }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center space-x-2 min-h-[44px]"
              >
                <User className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Switch / Add Account</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => { setShowUserMenu(false); onLogout(); }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-rose-400 transition flex items-center space-x-2 border-t border-slate-800 min-h-[44px]"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Action: Ask AI Tutor */}
        <button
          type="button"
          onClick={() => onNavigate('chat')}
          className="flex items-center space-x-1 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition transform active:scale-95 shrink-0 min-h-[44px] min-w-[44px] justify-center"
          aria-label="Ask StudyPilot AI Tutor"
        >
          <Sparkles className="w-4 h-4 text-white shrink-0" />
          <span className="hidden sm:inline">Ask StudyPilot</span>
        </button>
      </div>
    </header>
  );
}
