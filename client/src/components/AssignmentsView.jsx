import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  Sparkles, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  Filter,
  Layers,
  ArrowRight,
  HelpCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { apiAssignments, apiSubjects } from '../api';

export default function AssignmentsView({ onGuideProblem }) {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'urgent', 'completed'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [breakingDownId, setBreakingDownId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New assignment form state
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(90);
  const [autoBreakdown, setAutoBreakdown] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  // Escape key handler for dialogs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showAddModal) {
        setShowAddModal(false);
      }
    };
    if (showAddModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [assignRes, subRes] = await Promise.all([
        apiAssignments.getAll(),
        apiSubjects.getAll()
      ]);
      setAssignments(assignRes.assignments || []);
      setSubjects(subRes.subjects || []);
      if (subRes.subjects?.length > 0 && !subjectId) {
        setSubjectId(subRes.subjects[0].id);
      }
    } catch (e) {
      console.error(e);
      setError('Unable to load assignments from server. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || !subjectId) return;

    try {
      await apiAssignments.create({
        subject_id: subjectId,
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate,
        estimated_minutes: estimatedMinutes,
        autoBreakdown
      });
      // Only clear form values on success
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      loadData();
    } catch (e) {
      alert('Failed to create assignment: ' + e.message);
      // Preserves form values on recoverable error
    }
  };

  const handleToggleSubtask = async (assignmentId, subtaskId) => {
    try {
      await apiAssignments.toggleSubtask(assignmentId, subtaskId);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBreakdownAI = async (id) => {
    try {
      setBreakingDownId(id);
      await apiAssignments.breakdown(id);
      loadData();
    } catch (e) {
      alert('Failed to breakdown assignment: ' + e.message);
    } finally {
      setBreakingDownId(null);
    }
  };

  const handleDeleteAssignment = async (a) => {
    if (!a) return;
    if (window.confirm(`Delete assignment "${a.title}"?`)) {
      await apiAssignments.delete(a.id);
      loadData();
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'pending') return a.status !== 'completed';
    if (filter === 'urgent') return a.priority === 'urgent' && a.status !== 'completed';
    if (filter === 'completed') return a.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center">
            <CheckSquare className="w-6 h-6 text-indigo-400 mr-2.5" />
            Assignment Tracking & Guidance
          </h1>
          <p className="text-xs text-slate-400">
            Autonomous milestone decomposition and Socratic problem-solving support.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Filters */}
          <div 
            role="group"
            aria-label="Assignment status filter"
            className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs"
          >
            {['all', 'pending', 'urgent', 'completed'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`min-h-[44px] sm:min-h-[32px] px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                aria-pressed={filter === f}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="min-h-[44px] flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
            aria-label="Add new assignment"
          >
            <Plus className="w-4 h-4" />
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div role="alert" className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="min-h-[44px] px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition text-xs flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Assignment Cards List */}
      <div className="space-y-4">
        {/* Loading skeleton state */}
        {loading && assignments.length === 0 ? (
          <div role="status" aria-busy="true" aria-label="Loading assignments..." className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex justify-between">
                  <div className="h-4 bg-slate-800 rounded w-1/4" />
                  <div className="h-4 bg-slate-800 rounded w-1/6" />
                </div>
                <div className="h-5 bg-slate-750 rounded w-1/2" />
                <div className="h-3 bg-slate-800/80 rounded w-3/4" />
                <div className="pt-3 border-t border-slate-800 flex justify-between">
                  <div className="h-3 bg-slate-800 rounded w-1/3" />
                  <div className="h-8 bg-slate-800 rounded w-24" />
                </div>
              </div>
            ))}
            <span className="sr-only">Loading assignments...</span>
          </div>
        ) : !loading && !error && filteredAssignments.length === 0 ? (
          /* Empty state */
          <div className="p-14 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-sm space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
            <h2 className="text-base font-bold text-white">No assignments found under the selected filter.</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {filter === 'all'
                ? 'Create a new assignment to keep track of due dates and AI-generated milestones.'
                : `You currently have no ${filter} assignments.`}
            </p>
            {filter === 'all' && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="min-h-[44px] mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
              >
                Create Assignment
              </button>
            )}
          </div>
        ) : (
          filteredAssignments.map((a) => {
            const isCompleted = a.status === 'completed';
            const subtasks = a.subtasks || [];
            const isBreakingDown = breakingDownId === a.id;

            return (
              <div
                key={a.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-slate-950/60 border-slate-800/80 opacity-75'
                    : a.priority === 'urgent'
                    ? 'bg-slate-900/90 border-rose-500/40 shadow-md shadow-rose-950/20'
                    : 'bg-slate-900/80 border-slate-800 shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-indigo-400 font-mono">
                        {a.subject_name || 'General Assignment'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        a.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        a.priority === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-slate-700/80 text-slate-300'
                      }`}>
                        {a.priority} Priority
                      </span>
                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Completed
                        </span>
                      )}
                    </div>

                    <h3 className={`text-base font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                      {a.title}
                    </h3>

                    {a.description && (
                      <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                        {a.description}
                      </p>
                    )}
                  </div>

                  {/* Actions & Due Date */}
                  <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="flex items-center text-xs font-semibold text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400 mr-1" />
                        <span>Due: {a.due_date}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-end mt-0.5">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Est: {a.estimated_minutes} mins</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAssignment(a)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 text-slate-500 hover:text-rose-400 transition"
                      aria-label={`Delete assignment: ${a.title}`}
                      title={`Delete assignment: ${a.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtasks Progress Bar & Checklist */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center">
                      <Layers className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
                      Actionable Milestones ({a.completed_subtasks_count || 0}/{subtasks.length})
                    </span>

                    <div className="flex items-center space-x-2">
                      {subtasks.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleBreakdownAI(a.id)}
                          disabled={isBreakingDown}
                          className="min-h-[44px] sm:min-h-[28px] px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold transition flex items-center space-x-1 border border-indigo-500/30 text-[11px]"
                          aria-label={`Break down ${a.title} with AI`}
                        >
                          {isBreakingDown ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Decomposing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Decompose with AI</span>
                            </>
                          )}
                        </button>
                      ) : null}

                      {a.description && (
                        <button
                          type="button"
                          onClick={() => onGuideProblem(`I need step-by-step guidance solving my assignment: "${a.title}". Problem requirements: ${a.description}`)}
                          className="min-h-[44px] sm:min-h-[28px] px-3 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-semibold transition flex items-center space-x-1 border border-purple-500/30 text-[11px]"
                          aria-label={`Get step-by-step guidance for ${a.title}`}
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
                          <span>Guided Solver</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {subtasks.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {subtasks.map((st) => {
                        const isDone = Boolean(st.is_completed);
                        return (
                          <div
                            key={st.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                              isDone
                                ? 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                                : 'bg-slate-850/60 border-slate-700/60 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <button
                                type="button"
                                onClick={() => handleToggleSubtask(a.id, st.id)}
                                className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                                  isDone
                                    ? 'bg-emerald-600 border-emerald-500 text-white'
                                    : 'border-slate-600 hover:border-indigo-400 text-transparent'
                                }`}
                                aria-label={`Toggle milestone: ${st.title}`}
                              >
                                <CheckCircle2 className="w-3 h-3 fill-current" />
                              </button>
                              <span className={isDone ? 'line-through' : 'font-medium'}>
                                {st.title}
                              </span>
                            </div>

                            <span className="text-[11px] text-slate-500 font-mono">
                              ~{st.estimated_minutes}m
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-assignment-modal-title"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 id="add-assignment-modal-title" className="text-lg font-bold text-white">Create New Assignment</h3>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="assignment-title-input" className="block text-slate-300 mb-1 font-medium">
                  Assignment Title
                </label>
                <input
                  id="assignment-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lab Report: Matrix Transformations"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="assignment-subject-select" className="block text-slate-300 mb-1 font-medium">
                    Subject
                  </label>
                  <select
                    id="assignment-subject-select"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="assignment-due-date-input" className="block text-slate-300 mb-1 font-medium">
                    Due Date
                  </label>
                  <input
                    id="assignment-due-date-input"
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="assignment-desc-input" className="block text-slate-300 mb-1 font-medium">
                  Description & Specific Problem Prompts
                </label>
                <textarea
                  id="assignment-desc-input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Paste problem prompt or submission requirements..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <label htmlFor="assignment-autobreakdown-checkbox" className="flex items-center space-x-2 cursor-pointer">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-200 font-medium">Auto-Breakdown into Milestones with AI</span>
                </label>
                <input
                  id="assignment-autobreakdown-checkbox"
                  type="checkbox"
                  checked={autoBreakdown}
                  onChange={(e) => setAutoBreakdown(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
