import dotenv from 'dotenv';
dotenv.config();

/**
 * Flagship Multi-Provider LLM Client
 * Native Integration for:
 * 1. ChatGPT (OpenAI GPT-4o / GPT-4o-mini)
 * 2. Claude (Anthropic Claude 3.5 Sonnet / Claude 3 Haiku)
 * 3. Gemini (Google Gemini 1.5 Flash / Gemini 2.0 Flash / Gemini 1.5 Pro)
 */

export async function callLLM({ 
  systemPrompt, 
  userPrompt, 
  temperature = 0.3, 
  responseFormat = 'text',
  apiKey = null,
  provider = null,
  model = null
}) {
  const cleanKey = apiKey ? apiKey.trim() : null;
  const requestedProvider = (provider || '').toLowerCase().trim();

  // 1. Determine active provider
  let targetProvider = 'gemini';
  if (requestedProvider === 'chatgpt' || requestedProvider === 'openai') {
    targetProvider = 'chatgpt';
  } else if (requestedProvider === 'claude' || requestedProvider === 'anthropic') {
    targetProvider = 'claude';
  } else if (requestedProvider === 'gemini' || requestedProvider === 'google') {
    targetProvider = 'gemini';
  } else if (cleanKey) {
    if (cleanKey.startsWith('sk-ant-')) targetProvider = 'claude';
    else if (cleanKey.startsWith('AIza')) targetProvider = 'gemini';
    else if (cleanKey.startsWith('sk-')) targetProvider = 'chatgpt';
  } else {
    // Check environment variables in priority
    if (process.env.GEMINI_API_KEY) targetProvider = 'gemini';
    else if (process.env.OPENAI_API_KEY || process.env.CHATGPT_API_KEY) targetProvider = 'chatgpt';
    else if (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY) targetProvider = 'claude';
  }

  // 2. Resolve API key for chosen provider
  let activeKey = cleanKey;
  if (!activeKey) {
    if (targetProvider === 'chatgpt') {
      activeKey = process.env.OPENAI_API_KEY || process.env.CHATGPT_API_KEY;
    } else if (targetProvider === 'claude') {
      activeKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    } else {
      activeKey = process.env.GEMINI_API_KEY;
    }
  }

  // 3. Dispatch to designated flagship engine
  if (activeKey) {
    try {
      if (targetProvider === 'chatgpt') {
        const targetModel = model || 'gpt-4o-mini';
        const content = await callChatGPT(activeKey, targetModel, systemPrompt, userPrompt, temperature, responseFormat);
        return { success: true, provider: 'ChatGPT', model: targetModel, content };
      }

      if (targetProvider === 'claude') {
        const targetModel = model || 'claude-3-5-sonnet-20241022';
        const content = await callClaude(activeKey, targetModel, systemPrompt, userPrompt, temperature, responseFormat);
        return { success: true, provider: 'Claude', model: targetModel, content };
      }

      if (targetProvider === 'gemini') {
        const targetModel = model || 'gemini-1.5-flash';
        const content = await callGemini(activeKey, targetModel, systemPrompt, userPrompt, temperature, responseFormat);
        return { success: true, provider: 'Gemini', model: targetModel, content };
      }
    } catch (err) {
      console.warn(`[LLM Client] ${targetProvider.toUpperCase()} call failed:`, err.message);

      // If user provided a Gemini key and ChatGPT failed or vice-versa, attempt fallback
      if (targetProvider !== 'gemini' && (process.env.GEMINI_API_KEY || (cleanKey && cleanKey.startsWith('AIza')))) {
        try {
          const fallbackKey = cleanKey?.startsWith('AIza') ? cleanKey : process.env.GEMINI_API_KEY;
          const content = await callGemini(fallbackKey, 'gemini-1.5-flash', systemPrompt, userPrompt, temperature, responseFormat);
          return { success: true, provider: 'Gemini (Auto-Fallback)', model: 'gemini-1.5-flash', content };
        } catch (fErr) {
          console.warn('[LLM Client] Fallback to Gemini also failed:', fErr.message);
        }
      }

      return {
        success: false,
        provider: targetProvider,
        error: err.message
      };
    }
  }

  return {
    success: false,
    provider: targetProvider,
    reason: `No API key configured for ${targetProvider.toUpperCase()}`
  };
}

/**
 * 1. ChatGPT (OpenAI GPT-4o / GPT-4o-mini)
 */
async function callChatGPT(apiKey, model = 'gpt-4o-mini', systemPrompt, userPrompt, temperature = 0.3, responseFormat = 'text') {
  const url = 'https://api.openai.com/v1/chat/completions';
  
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const payload = {
    model: model || 'gpt-4o-mini',
    messages,
    temperature,
    ...(responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {})
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`OpenAI API status ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  return text;
}

/**
 * 2. Claude (Anthropic Claude 3.5 Sonnet / Claude 3 Haiku)
 */
async function callClaude(apiKey, model = 'claude-3-5-sonnet-20241022', systemPrompt, userPrompt, temperature = 0.3, responseFormat = 'text') {
  const url = 'https://api.anthropic.com/v1/messages';

  // Anthropic model aliases normalization
  let targetModel = model;
  if (model === 'claude-3-5-sonnet' || model === 'claude-sonnet') {
    targetModel = 'claude-3-5-sonnet-20241022';
  } else if (model === 'claude-3-haiku' || model === 'claude-haiku') {
    targetModel = 'claude-3-haiku-20240307';
  }

  const payload = {
    model: targetModel,
    max_tokens: 4000,
    temperature,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt }
    ]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Anthropic Claude API status ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  return text;
}

/**
 * 3. Gemini (Google Gemini 1.5 Flash / Gemini 2.0 Flash)
 */
async function callGemini(apiKey, model = 'gemini-1.5-flash', systemPrompt, userPrompt, temperature = 0.3, responseFormat = 'text') {
  let targetModel = model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemPrompt}\n\nStudent Inquiry:\n${userPrompt}` }
        ]
      }
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: 3500,
      responseMimeType: responseFormat === 'json' ? 'application/json' : 'text/plain'
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Google Gemini API status ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

/**
 * Live API Key Verification Endpoint
 * Validates ChatGPT, Claude, and Gemini keys directly with live test payloads
 */
export async function testAPIKey(apiKey, provider = 'gemini', model = null) {
  try {
    const cleanKey = apiKey ? apiKey.trim() : '';
    if (!cleanKey) return { success: false, message: 'API key cannot be empty' };

    const targetProvider = (provider || '').toLowerCase();

    if (targetProvider === 'chatgpt' || targetProvider === 'openai' || cleanKey.startsWith('sk-') && !cleanKey.startsWith('sk-ant-')) {
      const targetModel = model || 'gpt-4o-mini';
      const reply = await callChatGPT(cleanKey, targetModel, 'You are an academic test agent.', 'Reply with "StudyPilot ChatGPT Online"', 0.1);
      return { 
        success: true, 
        message: `ChatGPT (${targetModel}) connected and verified!`, 
        provider: 'ChatGPT',
        model: targetModel,
        sample: reply 
      };
    }

    if (targetProvider === 'claude' || targetProvider === 'anthropic' || cleanKey.startsWith('sk-ant-')) {
      const targetModel = model || 'claude-3-5-sonnet-20241022';
      const reply = await callClaude(cleanKey, targetModel, 'You are an academic test agent.', 'Reply with "StudyPilot Claude Online"', 0.1);
      return { 
        success: true, 
        message: `Claude (${targetModel}) connected and verified!`, 
        provider: 'Claude',
        model: targetModel,
        sample: reply 
      };
    }

    if (targetProvider === 'gemini' || targetProvider === 'google' || cleanKey.startsWith('AIza')) {
      const targetModel = model || 'gemini-1.5-flash';
      const reply = await callGemini(cleanKey, targetModel, 'You are an academic test agent.', 'Reply with "StudyPilot Gemini Online"', 0.1);
      return { 
        success: true, 
        message: `Google Gemini (${targetModel}) connected and verified!`, 
        provider: 'Gemini',
        model: targetModel,
        sample: reply 
      };
    }

    return { success: false, message: `Unknown provider "${provider}". Please choose ChatGPT, Claude, or Gemini.` };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export function isLLMConfigured() {
  return Boolean(
    process.env.GEMINI_API_KEY || 
    process.env.OPENAI_API_KEY || 
    process.env.CHATGPT_API_KEY || 
    process.env.ANTHROPIC_API_KEY || 
    process.env.CLAUDE_API_KEY
  );
}
