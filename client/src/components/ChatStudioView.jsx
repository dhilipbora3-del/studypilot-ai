import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Trash2, 
  Bot, 
  User, 
  ShieldCheck, 
  PlusCircle, 
  Check, 
  Layers, 
  Calendar, 
  CheckSquare, 
  HelpCircle,
  Clock,
  Loader2,
  RefreshCw
} from 'lucide-react';
import AgentTraceViewer from './AgentTraceViewer';
import { apiChat, apiFlashcards, apiPlanner, apiAssignments } from '../api';

export default function ChatStudioView({ initialPrompt = '', onActionCompleted }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [dailyHours, setDailyHours] = useState(4);
  const [importStatus, setImportStatus] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const data = await apiChat.getHistory();
      if (data.history && data.history.length > 0) {
        setMessages(data.history);
      } else {
        // Welcome message from Manager Agent
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `### 👋 Welcome to StudyPilot AI!
I am your **Manager Agent**, coordinating an autonomous team of 5 specialized agents to help you excel:
- 💡 **AI Tutor Agent**: Explains concepts with analogies, notes, and worked examples.
- 📅 **Study Planner Agent**: Schedules conflict-free study plans and rest intervals.
- 📋 **Assignment Agent**: Deconstructs deadlines and guides problem solving.
- 🎯 **Exam Agent**: Generates mock tests and identifies weak areas.
- 🛡️ **Review Agent**: Verifies all calculations, schedules, and dates for 100% accuracy.

How can we assist your studies today? Try asking a question or selecting one of the suggested prompts below!`,
            agentTraces: [
              {
                agent: 'Manager Agent',
                role: 'System Initialization',
                status: 'READY',
                action: 'Initialized multi-agent collaborative workspace',
                details: 'All 6 agents online and ready for student queries',
                executionTimeMs: 4
              }
            ],
            metadata: {}
          }
        ]);
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query || !query.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: query.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await apiChat.sendMessage(query.trim(), dailyHours);

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: result.message,
        agentTraces: result.agentTraces,
        reviewSummary: result.reviewSummary,
        metadata: result.structuredData || {},
        totalExecutionTimeMs: result.totalExecutionTimeMs
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: `⚠️ **Request Notice**: Unable to complete request at this time (${err.message}). The deterministic fallback engine is retaining all current student data safely.`,
          agentTraces: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Clear chat history?')) {
      await apiChat.clearHistory();
      setMessages([]);
      loadChatHistory();
    }
  };

  // Helper to import flashcards directly into student's deck
  const handleSaveFlashcards = async (msgId, cards = []) => {
    try {
      setImportStatus(prev => ({ ...prev, [`fc_${msgId}`]: 'saving' }));
      for (const c of cards) {
        await apiFlashcards.create({
          subject_id: null,
          topic: c.topic || 'AI Tutor Note',
          front: c.front,
          back: c.back
        });
      }
      setImportStatus(prev => ({ ...prev, [`fc_${msgId}`]: 'saved' }));
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      alert('Failed to save flashcards: ' + err.message);
      setImportStatus(prev => ({ ...prev, [`fc_${msgId}`]: null }));
    }
  };

  // Helper to import schedule slots into timetable
  const handleApplySchedule = async (msgId, slots = []) => {
    try {
      setImportStatus(prev => ({ ...prev, [`slot_${msgId}`]: 'saving' }));
      await apiPlanner.saveSlots(slots, false);
      setImportStatus(prev => ({ ...prev, [`slot_${msgId}`]: 'saved' }));
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      alert('Failed to apply schedule: ' + err.message);
      setImportStatus(prev => ({ ...prev, [`slot_${msgId}`]: null }));
    }
  };

  const promptSuggestions = [
    "Explain Eigenvalues and eigenvectors with an intuitive real-world analogy",
    "Create a realistic 4-day revision timetable for my Calculus midterm",
    "Break down my Dynamic Programming assignment into step-by-step milestones",
    "Generate a 3-question mock test on Classical Mechanics with solutions",
    "How does Memoization differ from Tabulation in dynamic programming?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Studio Controls */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-800/80 border-b border-slate-700/80 text-xs">
        <div className="flex items-center space-x-2">
          <Bot className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-white">StudyPilot Multi-Agent Studio</span>
          <span className="text-slate-400">• Manager + 5 Autonomous Agents</span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <span>Daily hours:</span>
            <select
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-1.5 py-0.5 text-xs focus:outline-none"
            >
              <option value={2}>2 hrs</option>
              <option value={3}>3 hrs</option>
              <option value={4}>4 hrs</option>
              <option value={6}>6 hrs</option>
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            className="flex items-center space-x-1 text-slate-400 hover:text-rose-400 transition"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const hasTraces = msg.agentTraces && msg.agentTraces.length > 0;
          const meta = msg.metadata || {};

          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div className="flex items-start space-x-2.5 max-w-3xl">
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-indigo-600/30">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none shadow-lg'
                }`}>
                  {/* Message body text */}
                  <div className="prose prose-invert prose-sm max-w-none space-y-2 whitespace-pre-line font-sans">
                    {msg.content}
                  </div>

                  {/* Inline Flashcards Widget */}
                  {meta.flashcards && meta.flashcards.length > 0 && (
                    <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300 flex items-center">
                          <Layers className="w-3.5 h-3.5 mr-1" />
                          Generated Flashcards ({meta.flashcards.length})
                        </span>
                        <button
                          onClick={() => handleSaveFlashcards(msg.id, meta.flashcards)}
                          disabled={importStatus[`fc_${msg.id}`] === 'saved'}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-emerald-600 text-white text-[11px] font-semibold flex items-center space-x-1 transition"
                        >
                          {importStatus[`fc_${msg.id}`] === 'saved' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Saved to Decks</span>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-3 h-3" />
                              <span>Save to Flashcards</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-2">
                        {meta.flashcards.map((card, cIdx) => (
                          <div key={cIdx} className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
                            <span className="font-semibold text-slate-200 block mb-1">
                              Q: {card.front}
                            </span>
                            <span className="text-slate-400 block whitespace-pre-line">
                              A: {card.back}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inline Schedule Slots Widget */}
                  {meta.scheduleSlots && meta.scheduleSlots.length > 0 && (
                    <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300 flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          Proposed Timetable Blocks ({meta.scheduleSlots.length})
                        </span>
                        <button
                          onClick={() => handleApplySchedule(msg.id, meta.scheduleSlots)}
                          disabled={importStatus[`slot_${msg.id}`] === 'saved'}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-emerald-600 text-white text-[11px] font-semibold flex items-center space-x-1 transition"
                        >
                          {importStatus[`slot_${msg.id}`] === 'saved' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Applied to Schedule</span>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-3 h-3" />
                              <span>Apply to Timetable</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {meta.scheduleSlots.map((slot, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px]">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-slate-400">{slot.start_time}-{slot.end_time}</span>
                              <span className="font-medium text-slate-200">{slot.topic}</span>
                            </div>
                            <span className="text-slate-400">{slot.subject_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Multi-Agent Orchestration Trace */}
                  {!isUser && hasTraces && (
                    <AgentTraceViewer
                      traces={msg.agentTraces}
                      reviewSummary={msg.reviewSummary}
                      executionTimeMs={msg.totalExecutionTimeMs}
                    />
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start space-x-2.5 max-w-xl">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 rounded-tl-none space-y-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Manager Agent delegating to specialized agents...</span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-1 animate-pulse" />
                  Tutor / Planner
                </span>
                <span>→</span>
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                  Review Agent Verification
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts carousel */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 shrink-0 font-medium">Quick Prompts:</span>
          {promptSuggestions.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shrink-0 transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="p-3.5 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Tutor, request a study plan, break down an assignment, or practice a quiz..."
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition flex items-center space-x-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
