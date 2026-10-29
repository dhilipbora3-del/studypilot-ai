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
  Loader2
} from 'lucide-react';
import { apiAssignments, apiSubjects } from '../api';

export default function AssignmentsView({ onGuideProblem }) {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'urgent', 'completed'
  const [loading, setLoading] = useState(true);
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

  const loadData = async () => {
    try {
      setLoading(true);
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
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      loadData();
    } catch (e) {
      alert('Failed to create assignment: ' + e.message);
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

  const handleDeleteAssignment = async (id) => {
    if (confirm('Delete this assignment?')) {
      await apiAssignments.delete(id);
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
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center">
            <CheckSquare className="w-6 h-6 text-indigo-400 mr-2.5" />
            Assignments & Guided Solver
          </h1>
          <p className="text-xs text-slate-400">
            Automated priority scoring by Assignment Agent with step-by-step problem breakdown.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Filters */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            {['all', 'pending', 'urgent', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* Assignment Cards List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p>No assignments found under the selected filter.</p>
          </div>
        ) : (
          filteredAssignments.map((a) => {
            const isCompleted = a.status === 'completed';
            const subtasks = a.subtasks || [];
            const isBreakingDown = breakingDownId === a.id;

            return (
              <div
                key={a.id}
                className={`p-5 rounded-2xl border transition shadow-sm ${
                  isCompleted
                    ? 'bg-slate-950/40 border-slate-800/80 opacity-70'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-indigo-400 font-mono">
                        {a.subject_name || 'General'}
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
                  <div className="flex items-center space-x-3 shrink-0">
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
                      onClick={() => handleDeleteAssignment(a.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                      title="Delete assignment"
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
                          onClick={() => handleBreakdownAI(a.id)}
                          disabled={isBreakingDown}
                          className="flex items-center space-x-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                        >
                          {isBreakingDown ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          <span>AI Breakdown</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBreakdownAI(a.id)}
                          disabled={isBreakingDown}
                          className="text-[11px] text-slate-400 hover:text-indigo-400 transition"
                        >
                          Regenerate steps
                        </button>
                      )}

                      <button
                        onClick={() => onGuideProblem(`Guide me step-by-step through solving: "${a.title}" (${a.description})`)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/20 transition flex items-center space-x-1"
                      >
                        <Lightbulb className="w-3 h-3" />
                        <span>Socratic Problem Guide</span>
                      </button>
                    </div>
                  </div>

                  {/* Subtask checklist */}
                  {subtasks.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {subtasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleToggleSubtask(a.id, task.id)}
                          className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                            task.completed
                              ? 'bg-slate-950/40 border-slate-800 text-slate-500'
                              : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 text-slate-200'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition ${
                            task.completed
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-slate-500 hover:border-indigo-400 text-transparent'
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>

                          <div className="text-xs">
                            <span className={task.completed ? 'line-through text-slate-500' : 'font-medium'}>
                              {task.title}
                            </span>
                            {task.hint && !task.completed && (
                              <span className="block text-[11px] text-indigo-400/80 mt-0.5">
                                Tip: {task.hint}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <CheckSquare className="w-5 h-5 text-indigo-400 mr-2" />
              Add Assignment
            </h3>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lab Report: Matrix Transformations"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Subject</label>
                  <select
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
                  <label className="block text-slate-300 mb-1 font-medium">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Description & Specific Problem Prompts</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Paste problem prompt or submission requirements..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-200 font-medium">Auto-Breakdown with AI</span>
                </div>
                <input
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
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
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
