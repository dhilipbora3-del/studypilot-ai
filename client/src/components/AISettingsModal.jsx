import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Cpu, 
  ShieldCheck, 
  Loader2,
  Trash2
} from 'lucide-react';
import { apiAgents, getCustomLLMKey, setCustomLLMKey, getCustomLLMProvider } from '../api';

export default function AISettingsModal({ isOpen, onClose, onKeyUpdated }) {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getCustomLLMKey() || '');
      setProvider(getCustomLLMProvider() || 'gemini');
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);

    try {
      const res = await apiAgents.testKey({ apiKey: apiKey.trim(), provider });
      setTestResult(res);
      if (res.success) {
        setCustomLLMKey(apiKey.trim(), provider);
        if (onKeyUpdated) onKeyUpdated();
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setCustomLLMKey(apiKey.trim(), provider);
    if (onKeyUpdated) onKeyUpdated();
    onClose();
  };

  const handleClear = () => {
    setApiKey('');
    setCustomLLMKey(null, 'gemini');
    setTestResult(null);
    if (onKeyUpdated) onKeyUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Engine Configuration</h2>
              <p className="text-xs text-slate-400">Connect Google Gemini API for live multi-agent reasoning</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Provider Selection */}
          <div>
            <label className="block text-slate-300 mb-1.5 font-medium">Select Reasoning Provider</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  provider === 'gemini'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div>
                  <span className="font-bold text-white block">Google Gemini</span>
                  <span className="text-[10px] text-slate-400">100% Free at AI Studio</span>
                </div>
                {provider === 'gemini' && <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => setProvider('openai')}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  provider === 'openai'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div>
                  <span className="font-bold text-white block">OpenAI</span>
                  <span className="text-[10px] text-slate-400">GPT-4o-mini</span>
                </div>
                {provider === 'openai' && <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />}
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-medium">
                {provider === 'gemini' ? 'Google Gemini API Key' : 'OpenAI API Key'}
              </label>
              {provider === 'gemini' && (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center text-[11px] font-semibold transition"
                >
                  <span>Get free key</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              )}
            </div>

            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Your key is stored securely in your browser and sent directly to your StudyPilot server.
            </p>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div className={`p-3 rounded-xl border flex items-start space-x-2 text-xs ${
              testResult.success 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Offline Engine Guarantee */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-300 flex items-center text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1" />
              Offline Fallback Ready
            </span>
            <p className="text-[11px] text-slate-400 leading-tight">
              If no key is configured, StudyPilot AI uses its deep pedagogical rule engine across Math, CS, Physics, and Biology.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-rose-400 transition flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Key</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testing || !apiKey.trim()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-1"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Test Connection</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
