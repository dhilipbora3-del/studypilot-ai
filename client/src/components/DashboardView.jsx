import React from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BookOpen, 
  Flame, 
  TrendingUp, 
  ArrowRight, 
  Play, 
  Layers, 
  Sparkles,
  Award,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function DashboardView({ 
  stats, 
  statsLoading = false,
  statsError = null,
  onRetryStats,
  todaySlots = [], 
  assignments = [], 
  exams = [], 
  onToggleSlot, 
  onNavigate, 
  onQuickChat 
}) {
  const nearestExam = stats?.nearestExam || (exams && exams.length > 0 ? {
    ...exams[0],
    days_remaining: Math.max(0, Math.ceil((new Date(exams[0].exam_date) - new Date()) / (1000 * 60 * 60 * 24)))
  } : null);

  const pendingAssignments = assignments.filter(a => a.status !== 'completed');
  const derivedUrgent = assignments.filter(a => 
    a.status !== 'completed' && (a.priority === 'urgent' || a.calculated_priority === 'urgent')
  ).length;
  const urgentCount = stats?.urgentAssignments ?? derivedUrgent;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Non-blocking error notification */}
      {statsError && (
        <div role="alert" className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{statsError} — displaying synchronized local student records.</span>
          </div>
          {onRetryStats && (
            <button
              type="button"
              onClick={onRetryStats}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-[11px] transition shrink-0 min-h-[36px]"
              aria-label="Retry loading dashboard statistics"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Welcome Banner with Quick Multi-Agent Prompt */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 p-5 sm:p-6 border border-indigo-500/20 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                StudyPilot Multi-Agent OS
              </span>
              <span className="text-slate-400 text-xs flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                Review Agent Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to accelerate your academic performance?
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Your 6-agent collaborative team is synchronized. Review Agent has verified today's schedule for zero conflicts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onQuickChat("Generate today's optimal study schedule for my upcoming exam")}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition transform active:scale-95 min-h-[44px]"
              aria-label="Optimize today's schedule with AI"
            >
              <Sparkles className="w-4 h-4" />
              <span>Optimize My Day</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('timer')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition min-h-[44px]"
              aria-label="Start Pomodoro study session"
            >
              <Play className="w-3.5 h-3.5 text-indigo-400" />
              <span>Start Pomodoro</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Focus Minutes */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Today's Study Time</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {statsLoading && !stats ? (
              <span className="text-base text-slate-500 animate-pulse font-normal">Loading...</span>
            ) : (
              <>
                {stats?.todayStudyMinutes || 0} <span className="text-sm font-normal text-slate-400">mins</span>
              </>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center">
            <TrendingUp className="w-3 h-3 text-emerald-400 mr-1" />
            <span>{stats?.weeklyStudyHours || 0} hrs studied this week</span>
          </div>
        </div>

        {/* Card 2: Pending Assignments */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Pending Assignments</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {stats?.pendingAssignments ?? pendingAssignments.length}
            <span className="text-xs font-semibold ml-2 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {urgentCount} urgent
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {stats?.completedAssignments || 0} assignments completed
          </div>
        </div>

        {/* Card 3: Nearest Exam Countdown */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Next Exam Countdown</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {nearestExam ? (
              <>
                {nearestExam.days_remaining} <span className="text-sm font-normal text-slate-400">days left</span>
              </>
            ) : (
              <span className="text-base font-normal text-slate-400">No exams pending</span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 truncate">
            {nearestExam?.title || 'Relax & consolidate your knowledge'}
          </div>
        </div>

        {/* Card 4: Quiz Mastery & Streak */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Quiz Mastery Avg</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {stats?.averageQuizScore || 0}%
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center">
            <Flame className="w-3 h-3 text-amber-400 mr-1" />
            <span>{stats?.streakDays || 1} day study streak</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Study Plan & Pending Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Today's Study Plan & Timetable */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center">
                  <Calendar className="w-5 h-5 text-indigo-400 mr-2" />
                  Today's Study Plan
                </h2>
                <p className="text-xs text-slate-400">
                  Verified conflict-free by Review Agent • {todaySlots.filter(s => s.is_completed).length} of {todaySlots.length} completed
                </p>
              </div>

              <button
                onClick={() => onNavigate('planner')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center transition"
              >
                <span>Full Timetable</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>

            {todaySlots.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                <p>No study blocks scheduled for today yet.</p>
                <button
                  onClick={() => onNavigate('planner')}
                  className="mt-3 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Generate Today's Plan with AI
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todaySlots.map((slot) => {
                  const isBreak = slot.type === 'break';
                  return (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                        slot.is_completed
                          ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                          : isBreak
                          ? 'bg-slate-800/40 border-slate-800 text-slate-400'
                          : 'bg-slate-800/80 border-slate-700/80 hover:border-indigo-500/40'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => onToggleSlot(slot.id)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                            slot.is_completed
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-slate-600 hover:border-indigo-400 text-transparent'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-bold ${slot.is_completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                              {slot.topic}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              slot.type === 'assignment' ? 'bg-amber-500/20 text-amber-300' :
                              slot.type === 'revision' ? 'bg-purple-500/20 text-purple-300' :
                              slot.type === 'break' ? 'bg-slate-700 text-slate-300' :
                              'bg-indigo-500/20 text-indigo-300'
                            }`}>
                              {slot.type}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {slot.subject_name} • {slot.start_time} - {slot.end_time}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <button
                          onClick={() => onQuickChat(`Help me study for: ${slot.topic} (${slot.subject_name})`)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/20 transition flex items-center space-x-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>AI Tutor</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick AI Prompts Carousel */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
              Suggested Multi-Agent Tasks
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onQuickChat("Explain dynamic programming memoization with an analogy and practice question")}
                className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-left text-slate-300 hover:text-white border border-slate-700/60 transition"
              >
                💡 Explain Dynamic Programming with an analogy
              </button>
              <button
                onClick={() => onQuickChat("Break down my upcoming linear algebra assignment into milestone steps")}
                className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-left text-slate-300 hover:text-white border border-slate-700/60 transition"
              >
                📋 Deconstruct Linear Algebra Lab assignment
              </button>
              <button
                onClick={() => onQuickChat("Generate a 4-question mock test on Rotational Dynamics in Physics")}
                className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-left text-slate-300 hover:text-white border border-slate-700/60 transition"
              >
                🎯 Generate Physics Mock Test with instant grading
              </button>
              <button
                onClick={() => onQuickChat("Create active recall flashcards on eigenvalues and matrix trace")}
                className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-left text-slate-300 hover:text-white border border-slate-700/60 transition"
              >
                🗂️ Generate active recall flashcards for Eigenvalues
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Pending Assignments & Upcoming Exams */}
        <div className="space-y-4">
          {/* Pending Assignments Widget */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-base font-bold text-white flex items-center">
                <AlertCircle className="w-4 h-4 text-amber-400 mr-2" />
                Pending Assignments
              </h2>
              <button
                onClick={() => onNavigate('assignments')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {pendingAssignments.slice(0, 3).map((assign) => (
                <div
                  key={assign.id}
                  className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/80 hover:border-slate-600 transition space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {assign.title}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {assign.subject_name} • Due: {assign.due_date}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      assign.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      assign.priority === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-indigo-500/20 text-indigo-300'
                    }`}>
                      {assign.priority}
                    </span>
                  </div>

                  {assign.subtasks_count > 0 && (
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round((assign.completed_subtasks_count / assign.subtasks_count) * 100)}%`
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      {assign.completed_subtasks_count || 0}/{assign.subtasks_count || 0} subtasks done
                    </span>
                    <button
                      onClick={() => onQuickChat(`Break down assignment: "${assign.title}" and guide me through the steps`)}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center"
                    >
                      <span>AI Solve Guide</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Exam Countdown Widget */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-base font-bold text-white flex items-center">
                <Award className="w-4 h-4 text-rose-400 mr-2" />
                Exam Countdown
              </h2>
              <button
                onClick={() => onNavigate('exams')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Revise
              </button>
            </div>

            {exams.slice(0, 2).map((exam) => (
              <div
                key={exam.id}
                className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/80 mb-2.5 last:mb-0 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {exam.title}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {exam.subject_name} • Date: {exam.exam_date}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {exam.days_remaining}d left
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Target Score: {exam.target_score}% (Weight: {exam.weight_percent}%)
                  </span>
                  <button
                    onClick={() => onNavigate('exams')}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center"
                  >
                    <span>Practice Test</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
