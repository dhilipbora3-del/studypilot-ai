const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('studypilot_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('studypilot_token', token);
  } else {
    localStorage.removeItem('studypilot_token');
  }
}

export function getActiveProvider() {
  return localStorage.getItem('studypilot_active_provider') || 'chatgpt';
}

export function setActiveProvider(provider) {
  localStorage.setItem('studypilot_active_provider', provider);
}

export function getProviderKey(provider) {
  const p = (provider || getActiveProvider()).toLowerCase();
  const directKey = localStorage.getItem(`studypilot_key_${p}`);
  if (directKey) return directKey;

  // Legacy fallback
  const legacyKey = localStorage.getItem('studypilot_llm_key');
  const legacyProvider = localStorage.getItem('studypilot_llm_provider');
  if (legacyKey) {
    if (p === 'claude' && legacyKey.startsWith('sk-ant-')) return legacyKey;
    if (p === 'gemini' && legacyKey.startsWith('AIza')) return legacyKey;
    if (p === 'chatgpt' && (legacyKey.startsWith('sk-') && !legacyKey.startsWith('sk-ant-'))) return legacyKey;
    if (legacyProvider === p) return legacyKey;
  }
  return '';
}

export function setProviderKey(provider, key) {
  const p = provider.toLowerCase();
  if (key && key.trim()) {
    localStorage.setItem(`studypilot_key_${p}`, key.trim());
    localStorage.setItem('studypilot_llm_key', key.trim());
    localStorage.setItem('studypilot_llm_provider', p);
  } else {
    localStorage.removeItem(`studypilot_key_${p}`);
  }
}

export function getActiveModel(provider) {
  const p = provider || getActiveProvider();
  const stored = localStorage.getItem(`studypilot_model_${p}`);
  if (stored) return stored;
  if (p === 'chatgpt') return 'gpt-4o-mini';
  if (p === 'claude') return 'claude-3-5-sonnet';
  if (p === 'gemini') return 'gemini-1.5-flash';
  return '';
}

export function setActiveModel(provider, model) {
  localStorage.setItem(`studypilot_model_${provider}`, model);
}

// Backwards compatibility wrappers
export function getCustomLLMKey() {
  return getProviderKey(getActiveProvider());
}

export function getCustomLLMProvider() {
  return getActiveProvider();
}

export function setCustomLLMKey(key, provider = 'gemini') {
  setActiveProvider(provider);
  setProviderKey(provider, key);
}

export async function fetchJson(endpoint, options = {}) {
  try {
    const token = getAuthToken();
    const activeProvider = getActiveProvider();
    const activeKey = getProviderKey(activeProvider);
    const activeModel = getActiveModel(activeProvider);

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(activeKey ? { 
        'X-LLM-Key': activeKey,
        'X-LLM-Provider': activeProvider,
        'X-LLM-Model': activeModel,
        'X-Gemini-Key': activeKey,
        'X-API-Key': activeKey
      } : {}),
      ...(options.headers || {})
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.details || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// Authentication API
export const apiAuth = {
  login: (credentials) =>
    fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  register: (userData) =>
    fetchJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
  getMe: () => fetchJson('/auth/me')
};

// Chat API
export const apiChat = {
  sendMessage: (message, dailyStudyHours, selectedAgent = 'auto', providerOverride = null, modelOverride = null, signal = null) => {
    const prov = providerOverride || getActiveProvider();
    return fetchJson('/chat', {
      method: 'POST',
      signal,
      body: JSON.stringify({ 
        message, 
        dailyStudyHours, 
        selectedAgent,
        apiKey: getProviderKey(prov),
        provider: prov,
        model: modelOverride || getActiveModel(prov)
      })
    });
  },
  getHistory: (signal = null) => fetchJson('/chat/history', { signal }),
  clearHistory: () => fetchJson('/chat/history', { method: 'DELETE' })
};

// Subjects API
export const apiSubjects = {
  getAll: () => fetchJson('/subjects'),
  create: (subject) =>
    fetchJson('/subjects', {
      method: 'POST',
      body: JSON.stringify(subject)
    }),
  update: (id, updates) =>
    fetchJson(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
  delete: (id) => fetchJson(`/subjects/${id}`, { method: 'DELETE' }),
  getTopics: (subjectId) => fetchJson(`/subjects/${subjectId}/topics`),
  addTopic: (subjectId, topic) =>
    fetchJson(`/subjects/${subjectId}/topics`, {
      method: 'POST',
      body: JSON.stringify(topic)
    }),
  updateTopic: (topicId, updates) =>
    fetchJson(`/subjects/topics/${topicId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
  deleteTopic: (topicId) =>
    fetchJson(`/subjects/topics/${topicId}`, { method: 'DELETE' })
};

// Assignments API
export const apiAssignments = {
  getAll: () => fetchJson('/assignments'),
  create: (assignment) =>
    fetchJson('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignment)
    }),
  update: (id, updates) =>
    fetchJson(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
  delete: (id) => fetchJson(`/assignments/${id}`, { method: 'DELETE' }),
  breakdown: (id) => fetchJson(`/assignments/${id}/breakdown`, { method: 'POST' }),
  toggleSubtask: (id, subtaskId) =>
    fetchJson(`/assignments/${id}/subtask/${subtaskId}`, { method: 'PUT' })
};

// Exams API
export const apiExams = {
  getAll: () => fetchJson('/exams'),
  create: (exam) =>
    fetchJson('/exams', {
      method: 'POST',
      body: JSON.stringify(exam)
    }),
  update: (id, updates) =>
    fetchJson(`/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
  delete: (id) => fetchJson(`/exams/${id}`, { method: 'DELETE' }),
  generateRevision: (id) =>
    fetchJson(`/exams/${id}/generate-revision`, { method: 'POST' }),
  toggleMilestone: (id, index) =>
    fetchJson(`/exams/${id}/milestone/${index}`, { method: 'PUT' })
};

// Planner API
export const apiPlanner = {
  getSlots: (date) => fetchJson(`/planner/slots${date ? `?date=${date}` : ''}`),
  generate: (params) =>
    fetchJson('/planner/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  saveSlots: (slots, replaceExisting = true) =>
    fetchJson('/planner/save-slots', {
      method: 'POST',
      body: JSON.stringify({ slots, replaceExisting })
    }),
  toggleSlot: (id) =>
    fetchJson(`/planner/slot/${id}/toggle`, { method: 'PUT' }),
  deleteSlot: (id) =>
    fetchJson(`/planner/slot/${id}`, { method: 'DELETE' })
};

// Quizzes API
export const apiQuizzes = {
  getAll: () => fetchJson('/quizzes'),
  getById: (id) => fetchJson(`/quizzes/${id}`),
  generate: (params) =>
    fetchJson('/quizzes/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  submit: (id, answers) =>
    fetchJson(`/quizzes/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    }),
  getStats: () => fetchJson('/quizzes/stats/summary')
};

// Flashcards API
export const apiFlashcards = {
  getAll: (dueOnly = false, subjectId = null) => {
    let url = `/flashcards?dueOnly=${dueOnly}`;
    if (subjectId) url += `&subject_id=${subjectId}`;
    return fetchJson(url);
  },
  create: (card) =>
    fetchJson('/flashcards', {
      method: 'POST',
      body: JSON.stringify(card)
    }),
  generate: (params) =>
    fetchJson('/flashcards/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  review: (id, rating) =>
    fetchJson(`/flashcards/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ rating })
    }),
  delete: (id) => fetchJson(`/flashcards/${id}`, { method: 'DELETE' })
};

// Timer API
export const apiTimer = {
  getSessions: () => fetchJson('/timer/sessions'),
  logSession: (session) =>
    fetchJson('/timer/log', {
      method: 'POST',
      body: JSON.stringify(session)
    })
};

// Stats API
export const apiStats = {
  getDashboard: () => fetchJson('/stats/dashboard')
};

// Agents API
export const apiAgents = {
  getStatus: () => fetchJson('/agents/status'),
  testKey: (params) =>
    fetchJson('/agents/test-key', {
      method: 'POST',
      body: JSON.stringify(params)
    })
};
