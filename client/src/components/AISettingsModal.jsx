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
  Trash2,
  Bot,
  Zap,
  Flame,
  Check
} from 'lucide-react';
import { 
  apiAgents, 
  getActiveProvider, 
  setActiveProvider, 
  getProviderKey, 
  setProviderKey,
  getActiveModel,
  setActiveModel
} from '../api';

export default function AISettingsModal({ isOpen, onClose, onKeyUpdated }) {
  const [selectedProvider, setSelectedProvider] = useState('chatgpt');
  const [keys, setKeys] = useState({
    chatgpt: '',
    claude: '',
    gemini: ''
  });
  const [models, setModels] = useState({
    chatgpt: 'gpt-4o-mini',
    claude: 'claude-3-5-sonnet',
    gemini: 'gemini-1.5-flash'
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const activeProv = getActiveProvider() || 'chatgpt';
      setSelectedProvider(activeProv);
      setKeys({
        chatgpt: getProviderKey('chatgpt') || '',
        claude: getProviderKey('claude') || '',
        gemini: getProviderKey('gemini') || ''
      });
      setModels({
        chatgpt: getActiveModel('chatgpt') || 'gpt-4o-mini',
        claude: getActiveModel('claude') || 'claude-3-5-sonnet',
        gemini: getActiveModel('gemini') || 'gemini-1.5-flash'
      });
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentKey = keys[selectedProvider] || '';
  const currentModel = models[selectedProvider];

  const handleKeyChange = (val) => {
    setKeys(prev => ({ ...prev, [selectedProvider]: val }));
    setTestResult(null);
  };

  const handleModelChange = (modelVal) => {
    setModels(prev => ({ ...prev, [selectedProvider]: modelVal }));
    setActiveModel(selectedProvider, modelVal);
    setTestResult(null);
  };

  const handleTestKey = async () => {
    if (!currentKey.trim()) {
      setTestResult({ success: false, message: `Please enter your ${providersConfig[selectedProvider].name} API key first.` });
      return;
    }
    setTesting(true);
    setTestResult(null);

    try {
      const res = await apiAgents.testKey({ 
        apiKey: currentKey.trim(), 
        provider: selectedProvider,
        model: currentModel
      });
      setTestResult(res);
      if (res.success) {
        setProviderKey(selectedProvider, currentKey.trim());
        setActiveProvider(selectedProvider);
        setActiveModel(selectedProvider, currentModel);
        if (onKeyUpdated) onKeyUpdated();
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    // Save current keys
    Object.entries(keys).forEach(([p, k]) => {
      if (k && k.trim()) {
        setProviderKey(p, k.trim());
      }
    });
    // Set active provider
    setActiveProvider(selectedProvider);
    setActiveModel(selectedProvider, currentModel);
    if (onKeyUpdated) onKeyUpdated();
    onClose();
  };

  const handleClear = () => {
    setProviderKey(selectedProvider, '');
    setKeys(prev => ({ ...prev, [selectedProvider]: '' }));
    setTestResult(null);
    if (onKeyUpdated) onKeyUpdated();
  };

  const providersConfig = {
    chatgpt: {
      name: 'ChatGPT',
      developer: 'OpenAI',
      badge: 'Official ChatGPT',
      color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
      activeRing: 'ring-emerald-500/50 border-emerald-500',
      icon: Bot,
      placeholder: 'sk-...',
      keyUrl: 'https://platform.openai.com/api-keys',
      models: [
        { id: 'gpt-4o-mini', label: 'GPT-4o-mini', desc: 'Fast, highly intelligent & economical' },
        { id: 'gpt-4o', label: 'GPT-4o', desc: 'Flagship reasoning & complex problem solving' }
      ]
    },
    claude: {
      name: 'Claude',
      developer: 'Anthropic',
      badge: 'Claude 3.5',
      color: 'border-amber-500 bg-amber-500/10 text-amber-400',
      activeRing: 'ring-amber-500/50 border-amber-500',
      icon: Sparkles,
      placeholder: 'sk-ant-...',
      keyUrl: 'https://console.anthropic.com/settings/keys',
      models: [
        { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', desc: 'Unrivaled conceptual breakdown & academic writing' },
        { id: 'claude-3-haiku', label: 'Claude 3 Haiku', desc: 'Ultra-fast lightweight responses' }
      ]
    },
    gemini: {
      name: 'Google Gemini',
      developer: 'Google DeepMind',
      badge: '100% Free Key',
      color: 'border-indigo-500 bg-indigo-500/10 text-indigo-400',
      activeRing: 'ring-indigo-500/50 border-indigo-500',
      icon: Zap,
      placeholder: 'AIzaSy...',
      keyUrl: 'https://aistudio.google.com/app/apikey',
      models: [
        { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', desc: 'Instant speed, free tier with no credit card' },
        { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Next-generation multimodal reasoning' }
      ]
    }
  };

  const currentConfig = providersConfig[selectedProvider];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Engine Configuration</h2>
              <p className="text-xs text-slate-400">Integrated support for ChatGPT, Claude, and Google Gemini</p>
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
        <div className="p-5 space-y-4 text-xs">
          {/* Provider Tabs */}
          <div>
            <label className="block text-slate-300 mb-1.5 font-medium">Select Active AI Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(providersConfig).map(([id, p]) => {
                const Icon = p.icon;
                const isSelected = selectedProvider === id;
                const hasKey = Boolean(keys[id]);

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setSelectedProvider(id); setTestResult(null); }}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? `bg-slate-800/90 ${p.activeRing} ring-1 text-white shadow-sm`
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      {hasKey && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Key Configured" />
                      )}
                    </div>
                    <span className="font-bold text-white text-xs block">{p.name}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{p.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Selection for current provider */}
          <div>
            <label className="block text-slate-300 mb-1.5 font-medium">
              {currentConfig.name} Model
            </label>
            <div className="grid grid-cols-2 gap-2">
              {currentConfig.models.map((m) => {
                const isSelected = currentModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleModelChange(m.id)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs text-white">{m.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-medium">
                {currentConfig.name} API Key
              </label>
              <a
                href={currentConfig.keyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 flex items-center text-[11px] font-semibold transition"
              >
                <span>Get {currentConfig.name} Key</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>

            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={currentKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder={currentConfig.placeholder}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            
            {selectedProvider === 'gemini' && (
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 shrink-0" />
                Google Gemini keys are 100% Free with 0 credit card needed at Google AI Studio.
              </p>
            )}
            {selectedProvider === 'chatgpt' && (
              <p className="text-[11px] text-slate-400 mt-1">
                Standard OpenAI API key (<code className="text-indigo-300 font-mono">sk-...</code>) powering ChatGPT GPT-4o.
              </p>
            )}
            {selectedProvider === 'claude' && (
              <p className="text-[11px] text-slate-400 mt-1">
                Anthropic Console key (<code className="text-indigo-300 font-mono">sk-ant-...</code>) powering Claude 3.5 Sonnet.
              </p>
            )}
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
              <div className="flex-1">
                <span className="font-semibold block">{testResult.message}</span>
                {testResult.sample && (
                  <span className="text-[11px] text-slate-400 block mt-0.5">Response: "{testResult.sample}"</span>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
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
                disabled={testing || !currentKey.trim()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-1"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                <span>Test Connection</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
              >
                Set as Active Model
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
