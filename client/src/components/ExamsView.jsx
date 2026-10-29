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
  Loader2
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

  const loadAll = async () => {
    try {
      const [examsRes, subjectsRes, quizzesRes] = await Promise.all([
        apiExams.getAll(),
        apiSubjects.getAll(),
        apiQuizzes.getAll()
      ]);
      setExams(examsRes.exams || []);
      setSubjects(subjectsRes.subjects || []);
      setQuizzes(quizzesRes.quizzes || []);
      if (subjectsRes.subjects?.length > 0) {
        setExamSubjectId(subjectsRes.subjects[0].id);
        setQuizSubjectId(subjectsRes.subjects[0].id);
      }
    } catch (e) {
      console.error(e);
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

  const handleDeleteExam = async (id) => {
    if (confirm('Delete this exam?')) {
      await apiExams.delete(id);
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
    } catch (e) {
      alert('Failed to evaluate quiz: ' + e.message);
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
            <Award className="w-6 h-6 text-rose-400 mr-2.5" />
            Exams, Mock Tests & Revision
          </h1>
          <p className="text-xs text-slate-400">
            Exam Agent creates mock tests, deterministically scores your answers, and identifies weak areas.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => setShowGenQuiz(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Mock Test</span>
          </button>

          <button
            onClick={() => setShowAddExam(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Exam</span>
          </button>
        </div>
      </div>

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
              onClick={() => setActiveQuiz(null)}
              className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 transition"
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
                    <h4 className="text-sm font-bold text-white leading-relaxed">
                      <span className="text-indigo-400 mr-2 font-mono">Q{idx + 1}.</span>
                      {q.question}
                    </h4>
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
                        btnStyle = 'bg-indigo-600/30 border-indigo-500 text-white ring-1 ring-indigo-500';
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={isSubmitted}
                          onClick={() => selectAnswer(q.id, oIdx)}
                          className={`p-3 rounded-xl border text-left text-xs transition flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isSubmitted && isRightAnswer && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                          {isSubmitted && isWrongChosen && <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation when submitted */}
                  {isSubmitted && q.explanation && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-700/60 text-xs text-slate-300 space-y-1">
                      <span className="font-bold text-indigo-300">Explanation:</span>
                      <p className="leading-relaxed text-slate-400">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Submit / Result Summary */}
          {!quizResult ? (
            <div className="flex justify-end pt-3">
              <button
                onClick={handleSubmitQuiz}
                disabled={submittingQuiz || Object.keys(quizAnswers).length === 0}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
              >
                {submittingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
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
                        onClick={() => onStudyTopic(`Teach me the fundamentals of ${wt.topic} because I missed questions on it during a mock test.`)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30 transition flex items-center space-x-1"
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

          {exams.map((exam) => (
            <div
              key={exam.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-indigo-400 font-mono">
                      {exam.subject_name || 'General'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      Target: {exam.target_score}%
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{exam.title}</h3>
                  <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Exam Date: {exam.exam_date}</span>
                    <span>•</span>
                    <span>Weight: {exam.weight_percent}%</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-center">
                    <span className="text-lg font-black block leading-none">{exam.days_remaining}</span>
                    <span className="text-[10px] font-semibold uppercase">days left</span>
                  </div>

                  <button
                    onClick={() => handleDeleteExam(exam.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {exam.notes && (
                <p className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                  {exam.notes}
                </p>
              )}

              {/* Spaced Revision Milestones */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
                  Exam Agent Spaced Revision Schedule
                </span>

                <div className="space-y-1.5">
                  {exam.revision_milestones.map((m, mIdx) => (
                    <div
                      key={mIdx}
                      onClick={() => handleToggleMilestone(exam.id, mIdx)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                        m.done
                          ? 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                          m.done ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-500 text-transparent'
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className={m.done ? 'line-through text-slate-500' : 'font-medium'}>
                          {m.task}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-400 shrink-0 ml-2">
                        {m.dayOffset === 0 ? 'Day of Exam' : `Day ${m.dayOffset}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Practice Quizzes Bank (1 span) */}
        <div className="space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Mock Quizzes Library ({quizzes.length})
          </span>

          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-3"
              >
                <div>
                  <span className="text-[11px] font-mono font-bold text-indigo-400 block">
                    {quiz.subject_name || 'Academic Quiz'}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{quiz.title}</h4>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {quiz.questions.length} questions • Best: {quiz.best_score ? `${quiz.best_score}%` : 'Not attempted'}
                  </span>
                </div>

                <button
                  onClick={() => startQuiz(quiz)}
                  className="w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition flex items-center justify-center space-x-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Start Mock Test</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Exam Modal */}
      {showAddExam && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Award className="w-5 h-5 text-rose-400 mr-2" />
              Add Upcoming Exam
            </h3>

            <form onSubmit={handleCreateExam} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Exam Name</label>
                <input
                  type="text"
                  required
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="e.g. Physics Midterm Examination"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Subject</label>
                  <select
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
                  <label className="block text-slate-300 mb-1 font-medium">Exam Date</label>
                  <input
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
                  <label className="block text-slate-300 mb-1 font-medium">Grade Weight (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={examWeight}
                    onChange={(e) => setExamWeight(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Target Score (%)</label>
                  <input
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
                <label className="block text-slate-300 mb-1 font-medium">Exam Notes & Materials Allowed</label>
                <textarea
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
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Sparkles className="w-5 h-5 text-purple-400 mr-2" />
              Generate Mock Quiz with Exam Agent
            </h3>

            <form onSubmit={handleGenerateQuiz} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Subject</label>
                <select
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
                <label className="block text-slate-300 mb-1 font-medium">Specific Topic (Optional)</label>
                <input
                  type="text"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  placeholder="e.g. Eigenvalues or Dynamic Programming"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Question Count</label>
                  <select
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
                  <label className="block text-slate-300 mb-1 font-medium">Difficulty</label>
                  <select
                    value={quizDifficulty}
                    onChange={(e) => setQuizDifficulty(e.target.value)}
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
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingQuiz}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-purple-600/30 flex items-center space-x-1"
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
