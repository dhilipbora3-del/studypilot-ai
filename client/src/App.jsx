import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import ChatStudioView from './components/ChatStudioView';
import SubjectsView from './components/SubjectsView';
import AssignmentsView from './components/AssignmentsView';
import PlannerView from './components/PlannerView';
import ExamsView from './components/ExamsView';
import FlashcardsView from './components/FlashcardsView';
import TimerView from './components/TimerView';
import AgentSystemModal from './components/AgentSystemModal';
import { apiStats, apiPlanner, apiAssignments, apiExams, apiAgents } from './api';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  CheckSquare, 
  CalendarDays, 
  Award, 
  Layers, 
  Timer, 
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [chatInitialPrompt, setChatInitialPrompt] = useState('');
  const [stats, setStats] = useState(null);
  const [todaySlots, setTodaySlots] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [agentStatus, setAgentStatus] = useState(null);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadGlobalData();
  }, []);

  const loadGlobalData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [statsRes, slotsRes, assignRes, examsRes, agentRes] = await Promise.all([
        apiStats.getDashboard().catch(() => ({ stats: null })),
        apiPlanner.getSlots(todayStr).catch(() => ({ slots: [] })),
        apiAssignments.getAll().catch(() => ({ assignments: [] })),
        apiExams.getAll().catch(() => ({ exams: [] })),
        apiAgents.getStatus().catch(() => ({ system: {}, agents: [] }))
      ]);

      if (statsRes.stats) setStats(statsRes.stats);
      if (slotsRes.slots) setTodaySlots(slotsRes.slots);
      if (assignRes.assignments) setAssignments(assignRes.assignments);
      if (examsRes.exams) setExams(examsRes.exams);
      if (agentRes) setAgentStatus(agentRes);
    } catch (e) {
      console.error('Failed to load global data', e);
    }
  };

  const handleToggleTodaySlot = async (slotId) => {
    try {
      await apiPlanner.toggleSlot(slotId);
      loadGlobalData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickChat = (prompt) => {
    setChatInitialPrompt(prompt);
    setCurrentTab('chat');
  };

  const handleStudyWithAI = (topicPrompt) => {
    setChatInitialPrompt(topicPrompt);
    setCurrentTab('chat');
  };

  const handleGenerateQuizForSubject = (subject) => {
    setCurrentTab('exams');
  };

  const nearestExamDays = stats?.nearestExam?.days_remaining ?? (exams[0]?.days_remaining ?? null);

  const mobileNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'AI Studio', icon: MessageSquare },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: CheckSquare },
    { id: 'planner', label: 'Planner', icon: CalendarDays },
    { id: 'exams', label: 'Exams', icon: Award },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'timer', label: 'Timer', icon: Timer },
    { id: 'agents', label: 'Agents', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        streak={stats?.streakDays || 1}
        agentStatus={agentStatus}
        onOpenSystemModal={() => setIsSystemModalOpen(true)}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          setMobileMenuOpen(false);
        }}
        currentTab={currentTab}
      />

      {/* Mobile Menu Button Banner */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <span className="font-bold text-white capitalize">{currentTab}</span>
        </div>

        <span className="text-[11px] text-indigo-400 font-semibold">
          StudyPilot Multi-Agent OS
        </span>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-3 grid grid-cols-3 gap-2 z-20 animate-in slide-in-from-top duration-200">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center p-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main App Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingAssignments={stats?.pendingAssignments ?? assignments.filter(a => a.status !== 'completed').length}
          nearestExamDays={nearestExamDays}
        />

        {/* Dynamic View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              todaySlots={todaySlots}
              assignments={assignments}
              exams={exams}
              onToggleSlot={handleToggleTodaySlot}
              onNavigate={setCurrentTab}
              onQuickChat={handleQuickChat}
            />
          )}

          {currentTab === 'chat' && (
            <ChatStudioView
              initialPrompt={chatInitialPrompt}
              onActionCompleted={loadGlobalData}
            />
          )}

          {currentTab === 'subjects' && (
            <SubjectsView
              onStudyWithAI={handleStudyWithAI}
              onGenerateQuiz={handleGenerateQuizForSubject}
            />
          )}

          {currentTab === 'assignments' && (
            <AssignmentsView
              onGuideProblem={handleQuickChat}
            />
          )}

          {currentTab === 'planner' && (
            <PlannerView
              onStudyWithAI={handleStudyWithAI}
            />
          )}

          {currentTab === 'exams' && (
            <ExamsView
              onStudyTopic={handleStudyWithAI}
            />
          )}

          {currentTab === 'flashcards' && (
            <FlashcardsView
              onStudyTopic={handleStudyWithAI}
            />
          )}

          {currentTab === 'timer' && (
            <TimerView />
          )}

          {currentTab === 'agents' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <AgentSystemModal
                  isOpen={true}
                  onClose={() => setCurrentTab('dashboard')}
                  agentStatus={agentStatus}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Multi-Agent Architecture Modal */}
      <AgentSystemModal
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
        agentStatus={agentStatus}
      />
    </div>
  );
}
