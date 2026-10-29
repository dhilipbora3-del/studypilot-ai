import React, { useState, useEffect, useRef } from 'react';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Flame, 
  BookOpen, 
  Calendar, 
  Clock, 
  Sparkles,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiTimer, apiSubjects } from '../api';

export default function TimerView() {
  const [mode, setMode] = useState('pomodoro'); // 'pomodoro' (25m), 'deep' (50m), 'shortBreak' (5m), 'stopwatch'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [sessions, setSessions] = useState([]);
  const [todayMinutes, setTodayMinutes] = useState(0);

  const initialTimeMap = {
    pomodoro: 25 * 60,
    deep: 50 * 60,
    shortBreak: 5 * 60,
    stopwatch: 0
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        if (mode === 'stopwatch') {
          setTimeLeft(prev => prev + 1);
        } else {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setIsRunning(false);
              handleTimerComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const loadData = async () => {
    try {
      const [sessionsRes, subjectsRes] = await Promise.all([
        apiTimer.getSessions(),
        apiSubjects.getAll()
      ]);
      setSessions(sessionsRes.sessions || []);
      setTodayMinutes(sessionsRes.todayMinutes || 0);
      setSubjects(subjectsRes.subjects || []);
      if (subjectsRes.subjects?.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subjectsRes.subjects[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const switchMode = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(initialTimeMap[newMode]);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(initialTimeMap[mode]);
  };

  const handleTimerComplete = async () => {
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    const duration = Math.round(initialTimeMap[mode] / 60);
    try {
      await apiTimer.logSession({
        subject_id: selectedSubjectId || null,
        duration_minutes: duration,
        mode,
        notes: notes || 'Completed focused study session'
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopwatchFinish = async () => {
    setIsRunning(false);
    const duration = Math.max(1, Math.round(timeLeft / 60));
    try {
      await apiTimer.logSession({
        subject_id: selectedSubjectId || null,
        duration_minutes: duration,
        mode: 'stopwatch',
        notes: notes || 'Logged active focus stopwatch'
      });
      confetti({ particleCount: 60, spread: 60 });
      setTimeLeft(0);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Progress circle percentage
  const total = initialTimeMap[mode] || 1;
  const progressPercent = mode === 'stopwatch' 
    ? 100 
    : Math.min(100, Math.round(((total - timeLeft) / total) * 100));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center">
            <Timer className="w-6 h-6 text-indigo-400 mr-2.5" />
            Focus Timer & Study History
          </h1>
          <p className="text-xs text-slate-400">
            Log active study sessions to database and build long-term retention streaks.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-400 font-semibold">
          <Clock className="w-4 h-4" />
          <span>Today: {todayMinutes} mins focused</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Active Timer */}
        <div className="md:col-span-2 p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col items-center justify-between space-y-6">
          {/* Mode Selector */}
          <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => switchMode('pomodoro')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                mode === 'pomodoro' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pomodoro (25m)
            </button>

            <button
              onClick={() => switchMode('deep')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                mode === 'deep' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Deep Work (50m)
            </button>

            <button
              onClick={() => switchMode('shortBreak')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                mode === 'shortBreak' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Rest Break (5m)
            </button>

            <button
              onClick={() => switchMode('stopwatch')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                mode === 'stopwatch' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Stopwatch
            </button>
          </div>

          {/* Big Circular Timer Display */}
          <div className="relative flex items-center justify-center my-4">
            <div className="w-64 h-64 rounded-full border-4 border-slate-800 flex items-center justify-center relative overflow-hidden bg-slate-950/60 shadow-inner">
              <div 
                className="absolute inset-0 bg-indigo-500/10 rounded-full transition-all duration-1000"
                style={{ clipPath: `inset(${100 - progressPercent}% 0 0 0)` }}
              />

              <div className="text-center relative z-10">
                <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white block">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mt-2 block">
                  {isRunning ? 'Session Active' : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* Subject & Notes Tagging */}
          <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Tag Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Study Focus Note</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Practicing problem set 4"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Controls: Play/Pause/Reset */}
          <div className="flex items-center space-x-4 pt-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition transform active:scale-95 flex items-center space-x-2"
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Pause Session</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start Focus</span>
                </>
              )}
            </button>

            <button
              onClick={resetTimer}
              className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {mode === 'stopwatch' && isRunning && (
              <button
                onClick={handleStopwatchFinish}
                className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
              >
                Save & Finish
              </button>
            )}
          </div>
        </div>

        {/* Right Column (1 span): Study Session History */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center">
              <Calendar className="w-4 h-4 text-indigo-400 mr-2" />
              Recent Study Sessions
            </h2>
            <span className="text-xs text-slate-400">{sessions.length} logged</span>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No study sessions logged yet. Complete a Pomodoro block to record history.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>{s.subject_name || 'General Focus'}</span>
                    <span className="text-emerald-400 font-mono">+{s.duration_minutes}m</span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-tight">
                    {s.notes || 'Completed focus block'}
                  </p>

                  <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-between">
                    <span className="capitalize">{s.mode}</span>
                    <span>{new Date(s.completed_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
