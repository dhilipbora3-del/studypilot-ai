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

export async function fetchJson(endpoint, options = {}) {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
  getMe: () => fetchJson('/auth/me'),
  getAccounts: () => fetchJson('/auth/accounts')
};

// Chat API
export const apiChat = {
  sendMessage: (message, dailyStudyHours) =>
    fetchJson('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, dailyStudyHours })
    }),
  getHistory: () => fetchJson('/chat/history'),
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
  getStatus: () => fetchJson('/agents/status')
};
