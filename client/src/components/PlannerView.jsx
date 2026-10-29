import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Coffee,
  BookOpen,
  Check,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { apiPlanner } from '../api';

export default function PlannerView({ onStudyWithAI }) {
  const [slots, setSlots] = useState([]);
  const [reviewResult, setReviewResult] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);

  // Generator form options
  const [daysCount, setDaysCount] = useState(1);
  const [dailyHours, setDailyHours] = useState(4);
  const [startHour, setStartHour] = useState(9);
  const [preferredBlock, setPreferredBlock] = useState(50);
  const [breakDuration, setBreakDuration] = useState(10);

  useEffect(() => {
    loadSlots(selectedDate);
  }, [selectedDate]);

  const loadSlots = async (date) => {
    try {
      setLoading(true);
      const res = await apiPlanner.getSlots(date);
      setSlots(res.slots || []);
      setReviewResult(res.review || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSlot = async (id) => {
    try {
      await apiPlanner.toggleSlot(id);
      loadSlots(selectedDate);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSlot = async (id) => {
    try {
      await apiPlanner.deleteSlot(id);
      loadSlots(selectedDate);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const res = await apiPlanner.generate({
        date: selectedDate,
        daysCount,
        dailyStudyHours: dailyHours,
        startHour,
        preferredBlockMinutes: preferredBlock,
        breakMinutes: breakDuration
      });

      if (res.plan?.slots) {
        // Automatically save to database
        await apiPlanner.saveSlots(res.plan.slots, true);
        setShowGenModal(false);
        loadSlots(selectedDate);
      }
    } catch (e) {
      alert('Failed to generate schedule: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const changeDateByDays = (delta) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + delta);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center">
            <CalendarDays className="w-6 h-6 text-indigo-400 mr-2.5" />
            Timetable & Study Planner
          </h1>
          <p className="text-xs text-slate-400">
            Intelligent time allocation by Study Planner Agent with collision audits by Review Agent.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={() => setShowGenModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition transform active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Study Plan</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & Review Agent Verification Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeDateByDays(-1)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
          />

          <button
            onClick={() => changeDateByDays(1)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition font-medium"
          >
            Today
          </button>
        </div>

        {/* Review Agent Verification Status */}
        {reviewResult && (
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium border ${
            reviewResult.passed
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
          }`}>
            {reviewResult.passed ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{reviewResult.message}</span>
          </div>
        )}
      </div>

      {/* Timetable Slots Timeline */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-3">
        {slots.length === 0 ? (
          <div className="text-center py-14 text-slate-400 space-y-3">
            <CalendarDays className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm">No study blocks planned for {selectedDate}.</p>
            <button
              onClick={() => setShowGenModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
            >
              Generate AI Schedule for this Day
            </button>
          </div>
        ) : (
          slots.map((slot) => {
            const isBreak = slot.type === 'break';
            const isCompleted = Boolean(slot.is_completed);

            return (
              <div
                key={slot.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition ${
                  isBreak
                    ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                    : isCompleted
                    ? 'bg-slate-950/60 border-slate-800 opacity-60'
                    : 'bg-slate-800/80 border-slate-700 hover:border-indigo-500/50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {!isBreak ? (
                    <button
                      onClick={() => handleToggleSlot(slot.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-600 hover:border-indigo-400 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-slate-800 text-slate-400">
                      <Coffee className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-bold ${isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
                        {slot.topic}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isBreak ? 'bg-slate-800 text-slate-400' :
                        slot.type === 'assignment' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        slot.type === 'revision' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {slot.type}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                      <span>{slot.subject_name || 'General Focus'}</span>
                      <span>•</span>
                      <span className="font-mono text-indigo-300">{slot.start_time} - {slot.end_time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!isBreak && (
                    <button
                      onClick={() => onStudyWithAI(`Help me study topic "${slot.topic}" for subject "${slot.subject_name}"`)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/20 transition flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span className="hidden sm:inline">AI Tutor</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Generate Schedule Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Sparkles className="w-5 h-5 text-indigo-400 mr-2" />
              Generate Study Schedule
            </h3>
            <p className="text-xs text-slate-400">
              The Study Planner Agent will balance your low-confidence subjects and approaching deadlines into structured blocks.
            </p>

            <form onSubmit={handleGenerate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Plan Scope</label>
                  <select
                    value={daysCount}
                    onChange={(e) => setDaysCount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={1}>1 Day (Today)</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days (Weekly Plan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Daily Study Hours</label>
                  <select
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={2}>2 Hours</option>
                    <option value={3}>3 Hours</option>
                    <option value={4}>4 Hours (Recommended)</option>
                    <option value={6}>6 Hours (Exam Prep)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Start Hour</label>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={8}>08:00 AM</option>
                    <option value={9}>09:00 AM</option>
                    <option value={10}>10:00 AM</option>
                    <option value={14}>02:00 PM (Afternoon)</option>
                    <option value={17}>05:00 PM (Evening)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Study Block Length</label>
                  <select
                    value={preferredBlock}
                    onChange={(e) => setPreferredBlock(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={50}>50 mins (Pomodoro)</option>
                    <option value={60}>60 mins</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-[11px] text-slate-400">
                🛡️ <strong>Review Agent Guarantee:</strong> Every generated slot is checked for overlapping times and guarantees a {breakDuration}-minute break between blocks.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center space-x-1"
                >
                  {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Generate Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
