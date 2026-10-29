import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Sparkles, 
  Star, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ChevronRight,
  HelpCircle,
  Award,
  Layers,
  Edit2
} from 'lucide-react';
import { apiSubjects } from '../api';

export default function SubjectsView({ onStudyWithAI, onGenerateQuiz }) {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);

  // New Subject Form state
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subColor, setSubColor] = useState('indigo');
  const [subTargetGrade, setSubTargetGrade] = useState('A');
  const [subConfidence, setSubConfidence] = useState(3);

  // New Topic Form state
  const [topicName, setTopicName] = useState('');
  const [topicDifficulty, setTopicDifficulty] = useState('medium');
  const [topicNotes, setTopicNotes] = useState('');

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const res = await apiSubjects.getAll();
      setSubjects(res.subjects || []);
      if (res.subjects && res.subjects.length > 0 && !selectedSubject) {
        selectSubject(res.subjects[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectSubject = async (subject) => {
    setSelectedSubject(subject);
    try {
      const res = await apiSubjects.getTopics(subject.id);
      setTopics(res.topics || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!subName.trim()) return;

    try {
      const res = await apiSubjects.create({
        name: subName.trim(),
        code: subCode.trim(),
        color: subColor,
        target_grade: subTargetGrade,
        confidence_level: subConfidence
      });
      setShowAddSubject(false);
      setSubName('');
      setSubCode('');
      loadSubjects();
      if (res.subject) selectSubject(res.subject);
    } catch (e) {
      alert('Failed to create subject: ' + e.message);
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!topicName.trim() || !selectedSubject) return;

    try {
      await apiSubjects.addTopic(selectedSubject.id, {
        name: topicName.trim(),
        difficulty: topicDifficulty,
        notes: topicNotes.trim()
      });
      setShowAddTopic(false);
      setTopicName('');
      setTopicNotes('');
      // refresh topics & subjects
      selectSubject(selectedSubject);
      loadSubjects();
    } catch (e) {
      alert('Failed to add topic: ' + e.message);
    }
  };

  const handleToggleTopicStatus = async (topic) => {
    const nextStatus = topic.status === 'mastered' ? 'in_progress' : 'mastered';
    try {
      await apiSubjects.updateTopic(topic.id, { status: nextStatus });
      selectSubject(selectedSubject);
      loadSubjects();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (confirm('Delete this subject and all associated topics?')) {
      await apiSubjects.delete(id);
      setSelectedSubject(null);
      loadSubjects();
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (confirm('Delete this topic?')) {
      await apiSubjects.deleteTopic(topicId);
      selectSubject(selectedSubject);
      loadSubjects();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center">
            <BookOpen className="w-6 h-6 text-indigo-400 mr-2.5" />
            Curriculum & Subjects
          </h1>
          <p className="text-xs text-slate-400">
            Track syllabus coverage, topic mastery levels, and generate AI-guided tutorials.
          </p>
        </div>

        <button
          onClick={() => setShowAddSubject(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Subject</span>
        </button>
      </div>

      {/* Main layout: Left subject cards list, Right topic detail view */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Subject Cards */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Your Subjects ({subjects.length})
          </span>

          {subjects.map((sub) => {
            const isSelected = selectedSubject?.id === sub.id;
            const masteryPct = sub.total_topics > 0 
              ? Math.round((sub.mastered_topics / sub.total_topics) * 100) 
              : 0;

            return (
              <div
                key={sub.id}
                onClick={() => selectSubject(sub)}
                className={`p-4 rounded-xl border cursor-pointer transition relative group ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 font-mono">
                      {sub.code || 'SUBJ'}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                      {sub.name}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1 bg-slate-950/60 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-300">
                    <Award className="w-3.5 h-3.5 text-amber-400 mr-0.5" />
                    <span>Target: {sub.target_grade}</span>
                  </div>
                </div>

                {/* Confidence Stars & Progress */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center space-x-1">
                      <span>Confidence:</span>
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${star <= sub.confidence_level ? 'fill-amber-400' : 'text-slate-600'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span>{masteredCount => `${sub.mastered_topics || 0}/${sub.total_topics || 0} topics`}</span>
                  </div>

                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${masteryPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Topics List for Selected Subject */}
        <div className="md:col-span-2 space-y-4">
          {selectedSubject ? (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md space-y-4">
              {/* Header with AI actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-indigo-400">{selectedSubject.code}</span>
                    <h2 className="text-lg font-bold text-white">{selectedSubject.name}</h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    Topics coverage & revision notes
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onStudyWithAI(`Explain key concepts and formulas for ${selectedSubject.name}`)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI Tutor</span>
                  </button>

                  <button
                    onClick={() => onGenerateQuiz(selectedSubject)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold border border-purple-500/30 transition"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Practice Quiz</span>
                  </button>

                  <button
                    onClick={() => setShowAddTopic(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Topic</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSubject(selectedSubject.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Topics list */}
              {topics.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  <p>No topics added for this subject yet.</p>
                  <button
                    onClick={() => setShowAddTopic(true)}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                  >
                    Add First Topic
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {topics.map((t) => {
                    const isMastered = t.status === 'mastered';
                    return (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-xl border transition ${
                          isMastered
                            ? 'bg-slate-950/40 border-slate-800 text-slate-300'
                            : 'bg-slate-800/70 border-slate-700/80 hover:border-indigo-500/40'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <button
                              onClick={() => handleToggleTopicStatus(t)}
                              className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 transition ${
                                isMastered
                                  ? 'bg-emerald-600 border-emerald-500 text-white'
                                  : 'border-slate-600 hover:border-indigo-400 text-transparent'
                              }`}
                              title={isMastered ? 'Mark in progress' : 'Mark mastered'}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>

                            <div>
                              <div className="flex items-center space-x-2">
                                <span className={`text-sm font-bold ${isMastered ? 'text-slate-300' : 'text-white'}`}>
                                  {t.name}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  t.difficulty === 'hard' ? 'bg-rose-500/20 text-rose-300' :
                                  t.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                                  'bg-emerald-500/20 text-emerald-300'
                                }`}>
                                  {t.difficulty}
                                </span>
                              </div>

                              {t.notes && (
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                  {t.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              onClick={() => onStudyWithAI(`Explain topic "${t.name}" in simple language with an analogy and practice question.`)}
                              className="px-2 py-1 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/20 transition flex items-center space-x-1"
                              title="Ask AI Tutor"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span className="hidden sm:inline">Teach Me</span>
                            </button>

                            <button
                              onClick={() => handleDeleteTopic(t.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              Select a subject from the left column to view topics and syllabus details.
            </div>
          )}
        </div>
      </div>

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Add New Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. Organic Chemistry"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Course Code</label>
                  <input
                    type="text"
                    value={subCode}
                    onChange={(e) => setSubCode(e.target.value)}
                    placeholder="e.g. CHEM-201"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Target Grade</label>
                  <select
                    value={subTargetGrade}
                    onChange={(e) => setSubTargetGrade(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Initial Confidence (1-5)</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={subConfidence}
                  onChange={(e) => setSubConfidence(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>1 (Needs Work)</span>
                  <span className="font-bold text-amber-400">{subConfidence} Stars</span>
                  <span>5 (Mastered)</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubject(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {showAddTopic && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Add Topic to {selectedSubject?.name}</h3>
            <form onSubmit={handleCreateTopic} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Topic Name</label>
                <input
                  type="text"
                  required
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Electrophilic Aromatic Substitution"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Difficulty Level</label>
                <select
                  value={topicDifficulty}
                  onChange={(e) => setTopicDifficulty(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Key Formulas / Notes</label>
                <textarea
                  rows={3}
                  value={topicNotes}
                  onChange={(e) => setTopicNotes(e.target.value)}
                  placeholder="Important formulas, theorems, or exam caveats..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTopic(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
                >
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
