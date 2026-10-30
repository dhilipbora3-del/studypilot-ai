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
  Copy,
  Layers, 
  Calendar, 
  CheckSquare, 
  HelpCircle,
  Clock,
  Loader2,
  RefreshCw,
  Key,
  Award,
  BookOpen,
  Sliders,
  ExternalLink
} from 'lucide-react';
import AgentTraceViewer from './AgentTraceViewer';
import AISettingsModal from './AISettingsModal';
import MarkdownRenderer from './MarkdownRenderer';
import PracticeQuestionCard from './PracticeQuestionCard';
import { 
  apiChat, 
  apiFlashcards, 
  apiPlanner, 
  getActiveProvider, 
  setActiveProvider, 
  getActiveModel, 
  setActiveModel, 
  getProviderKey 
} from '../api';

export default function ChatStudioView({ initialPrompt = '', onActionCompleted }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [dailyHours, setDailyHours] = useState(4);
  const [selectedAgent, setSelectedAgent] = useState('auto'); // 'auto', 'tutor', 'planner', 'assignment', 'exam'
  const [importStatus, setImportStatus] = useState({});
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const [activeProvider, setActiveProviderState] = useState(getActiveProvider() || 'chatgpt');
  const [activeModel, setActiveModelState] = useState(getActiveModel(getActiveProvider() || 'chatgpt'));
  const [hasCustomKey, setHasCustomKey] = useState(Boolean(getProviderKey(getActiveProvider() || 'chatgpt')));
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
    refreshEngineState();
  }, []);

  const refreshEngineState = () => {
    const prov = getActiveProvider() || 'chatgpt';
    setActiveProviderState(prov);
    setActiveModelState(getActiveModel(prov));
    setHasCustomKey(Boolean(getProviderKey(prov)));
  };

  const handleSwitchProvider = (prov) => {
    setActiveProvider(prov);
    setActiveProviderState(prov);
    const mod = getActiveModel(prov);
    setActiveModelState(mod);
    setHasCustomKey(Boolean(getProviderKey(prov)));
  };

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
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `### 👋 Welcome to StudyPilot Multi-Agent Studio!
Powered by **ChatGPT**, **Claude**, and **Google Gemini**:
- 💡 **AI Tutor**: Deep conceptual mastery, real-world analogies, active-recall flashcards.
- 📅 **Study Planner**: Optimizes conflict-free timetables with built-in ergonomic breaks.
- 📋 **Assignment Solver**: Deconstructs deadlines and provides Socratic problem guidance.
- 🎯 **Exam Specialist**: Prepares diagnostic practice questions and calculates mastery.
- 🛡️ **Review Agent**: Audits calculations, dates, and schedule collisions before presenting.

Select an agent below and switch between **ChatGPT**, **Claude**, and **Gemini** in the top bar!`,
            agentTraces: [
              {
                agent: 'Manager Agent',
                role: 'System Initialization',
                status: 'READY',
                action: 'Synchronized all 6 autonomous student agents with ChatGPT, Claude & Gemini',
                details: 'Collaborative multi-model pipeline ready for academic inquiries',
                executionTimeMs: 2
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
      const result = await apiChat.sendMessage(query.trim(), dailyHours, selectedAgent, activeProvider, activeModel);

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
          content: `⚠️ **Request Notice**: Unable to complete request (${err.message}). Your current student workspace is safely preserved.`,
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

  const handleCopySolution = (msgId, text) => {
    const cleanText = text ? text.replace(/### 🃏 Active Recall[\s\S]*$/, '').trim() : '';
    navigator.clipboard.writeText(cleanText || text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

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

  const agentsList = [
    { id: 'auto', label: 'Auto (Manager)', icon: Bot, color: 'text-indigo-400' },
    { id: 'tutor', label: 'AI Tutor', icon: Sparkles, color: 'text-purple-400' },
    { id: 'planner', label: 'Study Planner', icon: Calendar, color: 'text-blue-400' },
    { id: 'assignment', label: 'Assignment Solver', icon: CheckSquare, color: 'text-amber-400' },
    { id: 'exam', label: 'Exam Specialist', icon: Award, color: 'text-rose-400' }
  ];

  const promptSuggestions = [
    "Explain Mitosis vs Meiosis with a simple analogy and practice question",
    "Explain dynamic programming memoization vs tabulation in Python",
    "Create a realistic 4-day revision schedule for my Calculus exam",
    "How do I solve problem sets on Rotational Torque?",
    "Generate 3 practice test questions on Classical Mechanics"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Studio Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 bg-slate-800/80 border-b border-slate-700/80 gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <Bot className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-white">StudyPilot Multi-Agent Studio</span>
          <span className="text-slate-400 hidden md:inline">• 6 Synchronized Autonomous Agents</span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 self-end sm:self-auto">
          {/* Flagship Engine Selector Pill (ChatGPT, Claude, Gemini) */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 space-x-0.5">
            <button
              onClick={() => handleSwitchProvider('chatgpt')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                activeProvider === 'chatgpt'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Switch to OpenAI ChatGPT (GPT-4o)"
            >
              <span>ChatGPT</span>
            </button>
            <button
              onClick={() => handleSwitchProvider('claude')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                activeProvider === 'claude'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Switch to Anthropic Claude (Claude 3.5 Sonnet)"
            >
              <span>Claude</span>
            </button>
            <button
              onClick={() => handleSwitchProvider('gemini')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                activeProvider === 'gemini'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Switch to Google Gemini (1.5 / 2.0 Flash)"
            >
              <span>Gemini</span>
            </button>
          </div>

          {/* AI Key Config Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
              hasCustomKey
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasCustomKey ? 'Key Connected' : 'Configure Key'}</span>
            <span className={`w-2 h-2 rounded-full ${hasCustomKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </button>

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

      {/* Specialist Agent Selector Bar */}
      <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 flex items-center space-x-1.5 overflow-x-auto text-xs">
        <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider shrink-0 mr-1">
          Delegate to:
        </span>
        {agentsList.map((agent) => {
          const Icon = agent.icon;
          const isSelected = selectedAgent === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg shrink-0 transition text-xs font-semibold ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500/40'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : agent.color}`} />
              <span>{agent.label}</span>
            </button>
          );
        })}
      </div>

      {/* Optional Notice when key is missing */}
      {!hasCustomKey && (
        <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-500/20 flex items-center justify-between text-[11px] text-indigo-200">
          <div className="flex items-center space-x-1.5 truncate mr-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">
              Selected <strong>{activeProvider.toUpperCase()}</strong>. Connect your API key (or switch to <strong>Google Gemini</strong> for a 100% free key with no credit card).
            </span>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-2.5 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shrink-0 transition text-[11px]"
          >
            Connect Key
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const hasTraces = msg.agentTraces && msg.agentTraces.length > 0;
          const meta = msg.metadata || {};
          const isCopied = copiedMessageId === msg.id;

          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div className="flex items-start space-x-2.5 max-w-3xl w-full">
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-indigo-600/30">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`p-4 rounded-2xl text-sm leading-relaxed w-full ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20 max-w-2xl'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none shadow-lg'
                }`}>
                  {isUser ? (
                    <div className="font-sans leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  ) : (
                    <>
                      {/* Clean Solution Top Bar */}
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-700/60 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-slate-300 font-semibold">StudyPilot Verified Solution</span>
                          {msg.totalExecutionTimeMs && (
                            <span className="text-[11px] text-slate-500">
                              • {(msg.totalExecutionTimeMs / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleCopySolution(msg.id, msg.content)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900/80 hover:bg-slate-750 text-slate-300 hover:text-white transition text-[11px] border border-slate-700/60 shadow-sm"
                          title="Copy clean solution"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy Solution</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Clean Markdown Solution */}
                      <MarkdownRenderer
                        content={msg.content}
                        hideTrailers={Boolean(meta.flashcards?.length || meta.practiceQuestion)}
                      />

                      {/* Interactive Practice Question Checkpoint */}
                      {meta.practiceQuestion && (
                        <PracticeQuestionCard questionData={meta.practiceQuestion} />
                      )}

                      {/* Inline Flashcards Widget */}
                      {meta.flashcards && meta.flashcards.length > 0 && (
                        <div className="mt-4 p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-300 flex items-center">
                              <Layers className="w-3.5 h-3.5 mr-1" />
                              Active Recall Flashcards ({meta.flashcards.length})
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
                    </>
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
                <span>Manager Agent delegating to {selectedAgent === 'auto' ? 'specialized agents' : `${selectedAgent} agent`}...</span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-1 animate-pulse" />
                  Specialist Reasoning
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
            placeholder={
              selectedAgent === 'tutor' ? 'Ask AI Tutor to explain any topic or formula...' :
              selectedAgent === 'planner' ? 'Ask Study Planner to build a timetable...' :
              selectedAgent === 'assignment' ? 'Ask Assignment Solver to break down homework...' :
              selectedAgent === 'exam' ? 'Ask Exam Specialist to generate mock tests...' :
              'Ask StudyPilot AI: Tutor, Planner, Assignment Solver, or Exam Specialist...'
            }
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

      {/* AI Key & Model Settings Modal */}
      <AISettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onKeyUpdated={() => setHasCustomKey(Boolean(getCustomLLMKey()))}
      />
    </div>
  );
}
