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
import AuthModal from './components/AuthModal';
import { apiStats, apiPlanner, apiAssignments, apiExams, apiAgents, apiAuth, setAuthToken } from './api';
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
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [todaySlots, setTodaySlots] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [agentStatus, setAgentStatus] = useState(null);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const res = await apiAuth.getMe();
      if (res.user) {
        setCurrentUser(res.user);
      }
    } catch (e) {
      console.log('No active session, fallback to default student');
    } finally {
      loadGlobalData();
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const res = await apiStats.getDashboard();
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.warn('Dashboard stats refresh error:', err.message);
      setStatsError('Unable to load live dashboard stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadGlobalData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      setStatsLoading(true);
      const [statsRes, slotsRes, assignRes, examsRes, agentRes] = await Promise.all([
        apiStats.getDashboard()
          .then(res => { setStatsError(null); return res; })
          .catch((err) => { setStatsError('Failed to fetch dashboard stats'); return { stats: null }; }),
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
    } finally {
      setStatsLoading(false);
    }
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    loadGlobalData();
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthModalOpen(true);
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
        currentUser={currentUser}
        onOpenSystemModal={() => setIsSystemModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          setMobileMenuOpen(false);
        }}
        currentTab={currentTab}
      />

      {/* Mobile Menu Button Banner */}
      <div className="md:hidden flex items-center justify-between px-3 sm:px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs w-full max-w-full">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-white capitalize text-sm">{currentTab}</span>
        </div>

        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="text-xs text-indigo-400 font-semibold flex items-center space-x-1 min-h-[44px] px-2.5 rounded-lg hover:bg-slate-800"
          aria-label={currentUser?.name ? `Signed in as ${currentUser.name}` : "Sign In to account"}
        >
          <span>{currentUser?.name || 'Sign In'}</span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div 
          id="mobile-nav-drawer"
          className="md:hidden bg-slate-900 border-b border-slate-800 p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 z-20 animate-in slide-in-from-top duration-200"
        >
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl text-xs font-semibold transition min-h-[48px] ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main App Workspace */}
      <div className="flex-1 flex overflow-hidden w-full max-w-full">
        {/* Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingAssignments={stats?.pendingAssignments ?? assignments.filter(a => a.status !== 'completed').length}
          nearestExamDays={nearestExamDays}
        />

        {/* Dynamic View Container */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 max-w-full">
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              statsLoading={statsLoading}
              statsError={statsError}
              onRetryStats={loadStats}
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

      {/* User Authentication & Account Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        currentUser={currentUser}
      />
    </div>
  );
}
