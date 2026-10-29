import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  RotateCw, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Shuffle, 
  ChevronLeft, 
  ChevronRight,
  Loader2
} from 'lucide-react';
import { apiFlashcards, apiSubjects } from '../api';

export default function FlashcardsView({ onStudyTopic }) {
  const [cards, setCards] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filterDue, setFilterDue] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  // New manual card
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newSubjectId, setNewSubjectId] = useState('');

  // AI Gen Deck
  const [genTopic, setGenTopic] = useState('');
  const [genSubjectId, setGenSubjectId] = useState('');
  const [genCount, setGenCount] = useState(3);

  useEffect(() => {
    loadData();
  }, [filterDue, selectedSubjectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cardsRes, subjectsRes] = await Promise.all([
        apiFlashcards.getAll(filterDue, selectedSubjectId || null),
        apiSubjects.getAll()
      ]);
      setCards(cardsRes.flashcards || []);
      setSubjects(subjectsRes.subjects || []);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (rating) => {
    if (cards.length === 0) return;
    const currentCard = cards[currentIndex];
    try {
      await apiFlashcards.review(currentCard.id, rating);
      // Move to next card
      setIsFlipped(false);
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        loadData(); // reload when finished deck
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateManual = async (e) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    try {
      await apiFlashcards.create({
        subject_id: newSubjectId || null,
        topic: newTopic.trim() || 'General',
        front: newFront.trim(),
        back: newBack.trim()
      });
      setShowAddModal(false);
      setNewFront('');
      setNewBack('');
      setNewTopic('');
      loadData();
    } catch (e) {
      alert('Failed to create card: ' + e.message);
    }
  };

  const handleGenerateDeck = async (e) => {
    e.preventDefault();
    if (!genTopic.trim()) return;

    try {
      setGenerating(true);
      await apiFlashcards.generate({
        subject_id: genSubjectId || null,
        topic: genTopic.trim(),
        count: genCount
      });
      setShowGenModal(false);
      setGenTopic('');
      loadData();
    } catch (e) {
      alert('Failed to generate deck: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteCard = async (id) => {
    if (confirm('Delete this flashcard?')) {
      await apiFlashcards.delete(id);
      loadData();
    }
  };

  const currentCard = cards[currentIndex];

  // Box statistics
  const boxCounts = [1, 2, 3, 4, 5].map(boxNum => cards.filter(c => c.box === boxNum).length);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center">
            <Layers className="w-6 h-6 text-indigo-400 mr-2.5" />
            Spaced Repetition Flashcards
          </h1>
          <p className="text-xs text-slate-400">
            Leitner 5-box memory optimization powered by AI Tutor active recall notes.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => setShowGenModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Deck with AI</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Card</span>
          </button>
        </div>
      </div>

      {/* Leitner Box Status Bar */}
      <div className="grid grid-cols-5 gap-2 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
        {[
          { box: 1, label: 'Box 1: Daily', count: boxCounts[0], color: 'text-rose-400' },
          { box: 2, label: 'Box 2: 2-3 Days', count: boxCounts[1], color: 'text-amber-400' },
          { box: 3, label: 'Box 3: Weekly', count: boxCounts[2], color: 'text-indigo-400' },
          { box: 4, label: 'Box 4: Bi-Weekly', count: boxCounts[3], color: 'text-blue-400' },
          { box: 5, label: 'Box 5: Mastered', count: boxCounts[4], color: 'text-emerald-400' },
        ].map((b) => (
          <div key={b.box} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className={`text-base font-extrabold ${b.color}`}>{b.count}</span>
            <span className="block text-[10px] text-slate-400 truncate mt-0.5">{b.label}</span>
          </div>
        ))}
      </div>

      {/* Main Flashcard Interactive Player */}
      {cards.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-3">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-medium">No flashcards found in this view.</p>
          <div className="flex justify-center space-x-2 pt-2">
            <button
              onClick={() => setShowGenModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
            >
              Generate Cards with AI Tutor
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card tracker & Subject label */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-300">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px]">
                {currentCard.topic || 'General'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                Leitner Box {currentCard.box || 1}
              </span>
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer select-none perspective-1000 min-h-[300px] flex"
          >
            <div
              className={`w-full rounded-2xl p-8 border text-center flex flex-col justify-between transition-all duration-300 transform shadow-2xl relative ${
                isFlipped
                  ? 'bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/70 border-indigo-500/50 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header tag */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-4">
                <span className="font-bold uppercase tracking-wider text-indigo-400">
                  {isFlipped ? '💡 Answer / Conceptual Solution' : '❓ Question / Prompt'}
                </span>
                <span className="flex items-center text-slate-500">
                  <RotateCw className="w-3 h-3 mr-1" />
                  Click anywhere to flip
                </span>
              </div>

              {/* Card content text */}
              <div className="my-auto py-6">
                <p className="text-lg sm:text-xl font-bold text-white leading-relaxed whitespace-pre-line max-w-2xl mx-auto">
                  {isFlipped ? currentCard.back : currentCard.front}
                </p>
              </div>

              {/* Card footer */}
              <div className="text-[11px] text-slate-500 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                <span>Subject: {currentCard.subject_name || 'General Studies'}</span>
                <span>Reviewed {currentCard.review_count || 0} times</span>
              </div>
            </div>
          </div>

          {/* Spaced Repetition Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Rate your recall to schedule next spaced review
            </span>
            <div className="grid grid-cols-4 gap-2.5">
              <button
                onClick={() => handleReview('again')}
                className="py-3 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex flex-col items-center"
              >
                <span>Again</span>
                <span className="text-[10px] font-normal text-slate-400 mt-0.5">Box 1 (Today)</span>
              </button>

              <button
                onClick={() => handleReview('hard')}
                className="py-3 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex flex-col items-center"
              >
                <span>Hard</span>
                <span className="text-[10px] font-normal text-slate-400 mt-0.5">Hold Box (1d)</span>
              </button>

              <button
                onClick={() => handleReview('good')}
                className="py-3 px-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition flex flex-col items-center"
              >
                <span>Good</span>
                <span className="text-[10px] font-normal text-slate-400 mt-0.5">+1 Box ({Math.pow(2, (currentCard?.box || 1) + 1)}d)</span>
              </button>

              <button
                onClick={() => handleReview('easy')}
                className="py-3 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex flex-col items-center"
              >
                <span>Easy</span>
                <span className="text-[10px] font-normal text-slate-400 mt-0.5">+2 Boxes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Plus className="w-5 h-5 text-indigo-400 mr-2" />
              Add Flashcard
            </h3>

            <form onSubmit={handleCreateManual} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Subject</label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">General Studies</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Topic</label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. Linear Algebra"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Front (Question or Prompt)</label>
                <textarea
                  rows={2}
                  required
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="What is the condition for matrix invertibility?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Back (Answer or Solution)</label>
                <textarea
                  rows={3}
                  required
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="A square matrix A is invertible if and only if det(A) ≠ 0."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
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
                  Save Flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate AI Deck Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Sparkles className="w-5 h-5 text-purple-400 mr-2" />
              Generate Flashcards with AI Tutor Agent
            </h3>

            <form onSubmit={handleGenerateDeck} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Subject</label>
                <select
                  value={genSubjectId}
                  onChange={(e) => setGenSubjectId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">General Studies</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Topic to Review</label>
                <input
                  type="text"
                  required
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Dynamic Programming or Newton's Laws"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Number of Cards</label>
                <select
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={3}>3 Flashcards</option>
                  <option value={5}>5 Flashcards</option>
                </select>
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
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-purple-600/30 flex items-center space-x-1"
                >
                  {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Generate Deck</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
