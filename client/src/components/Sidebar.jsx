import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  CheckSquare, 
  CalendarDays, 
  GraduationCap, 
  Layers, 
  Timer, 
  ShieldAlert,
  Sparkles,
  Award
} from 'lucide-react';

export default function Sidebar({ currentTab, onSelectTab, pendingAssignments = 0, nearestExamDays = null }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Multi-Agent Studio', icon: MessageSquare, highlight: true },
    { id: 'subjects', label: 'Subjects & Topics', icon: BookOpen },
    { 
      id: 'assignments', 
      label: 'Assignments', 
      icon: CheckSquare, 
      badge: pendingAssignments > 0 ? pendingAssignments : null,
      badgeColor: 'bg-indigo-500 text-white'
    },
    { id: 'planner', label: 'Study Timetable', icon: CalendarDays },
    { 
      id: 'exams', 
      label: 'Exams & Mock Tests', 
      icon: Award,
      badge: nearestExamDays !== null ? `${nearestExamDays}d` : null,
      badgeColor: nearestExamDays <= 3 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-900 font-bold'
    },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'timer', label: 'Focus Timer', icon: Timer },
    { id: 'agents', label: 'Agent Architecture', icon: ShieldAlert }
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-3.5 hidden md:flex">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Student Workspace
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 transition ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}

              {item.highlight && !isActive && (
                <span className="flex items-center text-[10px] text-indigo-400 font-bold">
                  <Sparkles className="w-3 h-3 mr-0.5" />
                  AI
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Collaborative Agent System Badge at bottom */}
      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
        <div className="flex items-center space-x-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">Collaborative Multi-Agent</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Manager, Tutor, Planner, Assignment, Exam & Review Agents operating in concert.
        </p>
      </div>
    </aside>
  );
}
