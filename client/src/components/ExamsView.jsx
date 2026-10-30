import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Calendar, 
  Clock, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertCircle, 
  Trash2, 
  ShieldCheck, 
  TrendingUp, 
  BookOpen, 
  RotateCcw,
  Layers,
  ChevronRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiExams, apiQuizzes, apiSubjects } from '../api';

export default function ExamsView({ onStudyTopic }) {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddExam, setShowAddExam] = useState(false);
  const [showGenQuiz, setShowGenQuiz] = useState(false);

  // New Exam Form
  const [examTitle, setExamTitle] = useState('');
  const [examSubjectId, setExamSubjectId] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examWeight, setExamWeight] = useState(25);
  const [examTargetScore, setExamTargetScore] = useState(90);
  const [examNotes, setExamNotes] = useState('');

  // New Quiz Form
  const [quizSubjectId, setQuizSubjectId] = useState('');
  const [quizTopic, setQuizTopic] = useState('');
  const [quizCount, setQuizCount] = useState(4);
  const [quizDifficulty, setQuizDifficulty] = useState('medium');

  useEffect(() => {
    loadAll();
  }, []);

  // Escape key handler for dialogs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showAddExam) setShowAddExam(false);
        if (showGenQuiz) setShowGenQuiz(false);
      }
    };
    if (showAddExam || showGenQuiz) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddExam, showGenQuiz]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [examsRes, subjectsRes, quizzesRes] = await Promise.all([
        apiExams.getAll(),
        apiSubjects.getAll(),
        apiQuizzes.getAll()
      ]);
      setExams(examsRes.exams || []);
      setSubjects(subjectsRes.subjects || []);
      setQuizzes(quizzesRes.quizzes || []);
      if (subjectsRes.subjects?.length > 0) {
        if (!examSubjectId) setExamSubjectId(subjectsRes.subjects[0].id);
        if (!quizSubjectId) setQuizSubjectId(subjectsRes.subjects[0].id);
      }
    } catch (e) {
      console.error(e);
      setError('Unable to load examinations from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!examTitle.trim() || !examDate || !examSubjectId) return;

    try {
      await apiExams.create({
        subject_id: examSubjectId,
        title: examTitle.trim(),
        exam_date: examDate,
        weight_percent: examWeight,
        target_score: examTargetScore,
        notes: examNotes.trim()
      });
      setShowAddExam(false);
      setExamTitle('');
      setExamNotes('');
      loadAll();
    } catch (e) {
      alert('Failed to create exam: ' + e.message);
    }
  };

  const handleToggleMilestone = async (examId, milestoneIndex) => {
    try {
      await apiExams.toggleMilestone(examId, milestoneIndex);
      loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteExam = async (exam) => {
    if (!exam) return;
    if (window.confirm(`Delete exam "${exam.title}"?`)) {
      await apiExams.delete(exam.id);
      loadAll();
    }
  };

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    try {
      setGeneratingQuiz(true);
      const res = await apiQuizzes.generate({
        subject_id: quizSubjectId,
        topic: quizTopic.trim(),
        count: quizCount,
        difficulty: quizDifficulty
      });
      setShowGenQuiz(false);
      setQuizTopic('');
      loadAll();
      if (res.quiz) {
        startQuiz(res.quiz);
      }
    } catch (e) {
      alert('Failed to generate mock test: ' + e.message);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const selectAnswer = (questionId, optionIndex) => {
    if (quizResult) return; // locked after submission
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    try {
      setSubmittingQuiz(true);
      const res = await apiQuizzes.submit(activeQuiz.id, quizAnswers);
      setQuizResult(res);

      if (res.evaluation?.percentage >= 75) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      loadAll();
    } catch (e) {
      alert('Failed to score quiz: ' + e.message);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center">
            <Award className="w-6 h-6 text-indigo-400 mr-2.5" />
            Exams & Diagnostic Mastery
          </h1>
          <p className="text-xs text-slate-400">
            Countdown timelines, revision milestones, and interactive diagnostic practice tests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowGenQuiz(true)}
            className="min-h-[44px] flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition"
            aria-label="Generate mock test with AI"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Mock Test</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddExam(true)}
            className="min-h-[44px] flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
            aria-label="Add new exam"
          >
            <Plus className="w-4 h-4" />
            <span>New Exam</span>
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <div role="alert" className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadAll}
            className="min-h-[44px] px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition text-xs flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Active Interactive Quiz Player if open */}
      {activeQuiz && (
        <div className="p-6 rounded-2xl bg-slate-900 border-2 border-indigo-500/50 shadow-2xl space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
                {activeQuiz.subject_name || 'Mock Test'}
              </span>
              <h2 className="text-lg font-bold text-white">{activeQuiz.title}</h2>
            </div>

            <button
              type="button"
              onClick={() => setActiveQuiz(null)}
              className="min-h-[44px] text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 transition"
              aria-label="Close active test player"
            >
              Close Test
            </button>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {activeQuiz.questions.map((q, idx) => {
              const selectedOpt = quizAnswers[q.id];
              const isSubmitted = Boolean(quizResult);
              const isCorrect = isSubmitted && Number(selectedOpt) === Number(q.answerIndex);

              return (
                <div key={q.id || idx} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold text-white leading-relaxed">
                      <span className="text-indigo-400 mr-2 font-mono">Q{idx + 1}.</span>
                      {q.question}
                    </h3>
                    {isSubmitted && (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    )}
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, oIdx) => {
                      const isChosen = selectedOpt === oIdx;
                      const isRightAnswer = isSubmitted && q.answerIndex === oIdx;
                      const isWrongChosen = isSubmitted && isChosen && !isCorrect;

                      let btnStyle = 'bg-slate-900/80 border-slate-700 text-slate-200 hover:border-indigo-400';
                      if (isSubmitted) {
                        if (isRightAnswer) {
                          btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500';
                        } else if (isWrongChosen) {
                          btnStyle = 'bg-rose-950/60 border-rose-500 text-rose-200 ring-1 ring-rose-500';
                        } else {
                          btnStyle = 'bg-slate-900/40 border-slate-800 text-slate-500';
                        }
                      } else if (isChosen) {
                        btnStyle = 'bg-indigo-600 text-white border-indigo-500 shadow-sm';
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => selectAnswer(q.id, oIdx)}
                          className={`min-h-[44px] p-3 rounded-xl border text-left text-xs font-medium transition flex items-center space-x-2 ${btnStyle}`}
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-850 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation after submission */}
                  {isSubmitted && q.explanation && (
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-slate-300 mt-2">
                      <span className="font-semibold text-indigo-400 block mb-0.5">Solution & Explanation:</span>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Test Submission or Results Summary */}
          {!quizResult ? (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={submittingQuiz || Object.keys(quizAnswers).length < activeQuiz.questions.length}
                className="min-h-[44px] px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
              >
                {submittingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Submit Mock Test for Deterministic Scoring</span>
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center">
                    Score: {quizResult.evaluation.score} / {quizResult.evaluation.totalQuestions} ({quizResult.evaluation.percentage}%)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{quizResult.evaluation.feedback}</p>
                </div>

                {/* Review Agent Stamp */}
                {quizResult.reviewAgentStamp && (
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-medium self-start sm:self-auto">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Review Agent: {quizResult.reviewAgentStamp.message}</span>
                  </div>
                )}
              </div>

              {/* Weak Topics Diagnostic */}
              {quizResult.evaluation.weakTopics?.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    Diagnostic: Recommended Revision Focus
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quizResult.evaluation.weakTopics.map((wt, wIdx) => (
                      <button
                        key={wIdx}
                        type="button"
                        onClick={() => onStudyTopic(`Teach me the fundamentals of ${wt.topic} because I missed questions on it during a mock test.`)}
                        className="min-h-[44px] px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30 transition flex items-center space-x-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Revise {wt.topic} with AI Tutor</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grid: Upcoming Exams with Revision Milestones & Past Quizzes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exams Countdown Cards (2 spans) */}
        <div className="lg:col-span-2 space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Upcoming Examination Timelines ({exams.length})
          </span>

          {loading && exams.length === 0 ? (
            <div role="status" aria-busy="true" aria-label="Loading upcoming examinations..." className="space-y-4 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex justify-between">
                    <div className="h-4 bg-slate-800 rounded w-1/4" />
                    <div className="h-4 bg-slate-800 rounded w-16" />
                  </div>
                  <div className="h-6 bg-slate-750 rounded w-1/2" />
                  <div className="h-3 bg-slate-800 rounded w-3/4" />
                  <div className="space-y-2 pt-3 border-t border-slate-800">
                    <div className="h-3 bg-slate-800 rounded w-1/3" />
                    <div className="h-8 bg-slate-850 rounded w-full" />
                  </div>
                </div>
              ))}
              <span className="sr-only">Loading upcoming examinations...</span>
            </div>
          ) : !loading && !error && exams.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-sm space-y-3">
              <Award className="w-10 h-10 text-slate-600 mx-auto" />
              <h2 className="text-base font-bold text-white">No upcoming exams scheduled</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Schedule your midterms, finals, or diagnostic exams to generate automatic countdown milestones.
              </p>
              <button
                type="button"
                onClick={() => setShowAddExam(true)}
                className="min-h-[44px] mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
              >
                Schedule First Exam
              </button>
            </div>
          ) : (
            exams.map((exam) => (
              <div
                key={exam.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-indigo-400 font-mono">
                        {exam.subject_name || 'General Exam'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        Weight: {exam.weight_percent}%
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Target: {exam.target_score}%
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mt-1">{exam.title}</h3>

                    {exam.notes && (
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {exam.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="flex items-center text-xs font-semibold text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400 mr-1" />
                        <span>{exam.exam_date}</span>
                      </div>
                      <span className={`text-xs font-bold mt-0.5 block ${
                        exam.days_until <= 3 ? 'text-rose-400' :
                        exam.days_until <= 7 ? 'text-amber-400' :
                        'text-emerald-400'
                      }`}>
                        {exam.days_until === 0 ? 'Today!' : `${exam.days_until} days remaining`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteExam(exam)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 text-slate-500 hover:text-rose-400 transition"
                      aria-label={`Delete exam: ${exam.title}`}
                      title={`Delete exam: ${exam.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Revision Milestones */}
                {exam.revision_milestones?.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <span className="text-xs font-semibold text-slate-300 flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
                      Sequential Revision Milestones
                    </span>

                    <div className="space-y-1.5">
                      {exam.revision_milestones.map((m, mIdx) => (
                        <div
                          key={mIdx}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs transition ${
                            m.completed
                              ? 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                              : 'bg-slate-850/60 border-slate-700/60 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleToggleMilestone(exam.id, mIdx)}
                              className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                                m.completed
                                  ? 'bg-emerald-600 border-emerald-500 text-white'
                                  : 'border-slate-600 hover:border-indigo-400 text-transparent'
                              }`}
                              aria-label={`Toggle milestone: ${m.title}`}
                            >
                              <CheckCircle2 className="w-3 h-3 fill-current" />
                            </button>
                            <span className={m.completed ? 'line-through' : 'font-medium'}>
                              {m.title}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-500 font-mono">
                            {m.target_days_before}d before
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right Column: Past Quizzes History */}
        <div className="space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Generated Quizzes History ({quizzes.length})
          </span>

          {quizzes.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
              <p>No practice tests taken yet.</p>
              <button
                type="button"
                onClick={() => setShowGenQuiz(true)}
                className="min-h-[44px] mt-2 px-3 py-1.5 rounded-lg bg-purple-600 text-white font-semibold"
              >
                Generate First Test
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.map((q) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-indigo-400 font-bold">
                        {q.subject_name || 'General'}
                      </span>
                      <h4 className="text-xs font-bold text-white">{q.title}</h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => startQuiz(q)}
                      className="min-h-[44px] sm:min-h-[28px] px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold text-[11px] border border-indigo-500/30 transition"
                      aria-label={`Retake test: ${q.title}`}
                    >
                      Take Test
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>{q.questions?.length || 0} Questions</span>
                    <span className="capitalize">{q.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Exam Modal */}
      {showAddExam && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-exam-modal-title"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 id="add-exam-modal-title" className="text-lg font-bold text-white">Schedule New Exam</h3>

            <form onSubmit={handleCreateExam} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="exam-title-input" className="block text-slate-300 mb-1 font-medium">
                  Exam Title
                </label>
                <input
                  id="exam-title-input"
                  type="text"
                  required
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="e.g. Midterm Examination: Linear Algebra"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="exam-subject-select" className="block text-slate-300 mb-1 font-medium">
                    Subject
                  </label>
                  <select
                    id="exam-subject-select"
                    value={examSubjectId}
                    onChange={(e) => setExamSubjectId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="exam-date-input" className="block text-slate-300 mb-1 font-medium">
                    Exam Date
                  </label>
                  <input
                    id="exam-date-input"
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="exam-weight-input" className="block text-slate-300 mb-1 font-medium">
                    Grade Weight (%)
                  </label>
                  <input
                    id="exam-weight-input"
                    type="number"
                    min="1"
                    max="100"
                    value={examWeight}
                    onChange={(e) => setExamWeight(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="exam-target-score-input" className="block text-slate-300 mb-1 font-medium">
                    Target Score (%)
                  </label>
                  <input
                    id="exam-target-score-input"
                    type="number"
                    min="1"
                    max="100"
                    value={examTargetScore}
                    onChange={(e) => setExamTargetScore(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="exam-notes-input" className="block text-slate-300 mb-1 font-medium">
                  Exam Notes & Materials Allowed
                </label>
                <textarea
                  id="exam-notes-input"
                  rows={2}
                  value={examNotes}
                  onChange={(e) => setExamNotes(e.target.value)}
                  placeholder="Formula sheets allowed, calculator restrictions..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExam(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
                >
                  Save Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Mock Test Modal */}
      {showGenQuiz && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="gen-quiz-modal-title"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 id="gen-quiz-modal-title" className="text-lg font-bold text-white flex items-center">
              <Sparkles className="w-5 h-5 text-purple-400 mr-2" />
              Generate Mock Quiz with Exam Agent
            </h3>

            <form onSubmit={handleGenerateQuiz} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="mock-quiz-subject-select" className="block text-slate-300 mb-1 font-medium">
                  Subject
                </label>
                <select
                  id="mock-quiz-subject-select"
                  value={quizSubjectId}
                  onChange={(e) => setQuizSubjectId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="mock-quiz-topic-input" className="block text-slate-300 mb-1 font-medium">
                  Specific Topic (Optional)
                </label>
                <input
                  id="mock-quiz-topic-input"
                  type="text"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  placeholder="e.g. Eigenvalues or Dynamic Programming"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="mock-quiz-count-select" className="block text-slate-300 mb-1 font-medium">
                    Question Count
                  </label>
                  <select
                    id="mock-quiz-count-select"
                    value={quizCount}
                    onChange={(e) => setQuizCount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={4}>4 Questions</option>
                    <option value={6}>6 Questions</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="mock-quiz-difficulty-select" className="block text-slate-300 mb-1 font-medium">
                    Difficulty
                  </label>
                  <select
                    id="mock-quiz-difficulty-select"
                    value={quizDifficulty}
                    onChange={(e) => setQuizDifficulty(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard (Exam Level)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenQuiz(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingQuiz}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-purple-600/30 flex items-center space-x-1"
                >
                  {generatingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Generate Test</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
