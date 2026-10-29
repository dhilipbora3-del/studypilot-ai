import dotenv from 'dotenv';
dotenv.config();

/**
 * Universal Multi-Provider LLM Client
 * Supports:
 * 1. Google Gemini API (gemini-1.5-flash, gemini-2.0-flash)
 * 2. OpenAI API (gpt-4o-mini, gpt-4o)
 * 3. Groq API (llama-3.3-70b-versatile)
 * 4. User-provided keys via request header / session
 * 5. High-intelligence pedagogical fallback engine
 */

export async function callLLM({ 
  systemPrompt, 
  userPrompt, 
  temperature = 0.3, 
  responseFormat = 'text',
  apiKey = null,
  provider = null
}) {
  const geminiKey = apiKey || process.env.GEMINI_API_KEY;
  const openaiKey = (provider === 'openai' ? apiKey : null) || process.env.OPENAI_API_KEY;
  const groqKey = (provider === 'groq' ? apiKey : null) || process.env.GROQ_API_KEY;

  // 1. Try Gemini
  if (geminiKey && geminiKey.startsWith('AIza')) {
    try {
      const response = await callGemini(geminiKey, systemPrompt, userPrompt, temperature, responseFormat);
      return { success: true, provider: 'gemini-1.5-flash', content: response };
    } catch (err) {
      console.warn('[LLM Client] Gemini primary call failed, trying next:', err.message);
      // Try gemini-2.0-flash
      try {
        const response2 = await callGeminiModel(geminiKey, 'gemini-2.0-flash', systemPrompt, userPrompt, temperature, responseFormat);
        return { success: true, provider: 'gemini-2.0-flash', content: response2 };
      } catch (err2) {
        console.warn('[LLM Client] Gemini 2.0 call also failed:', err2.message);
      }
    }
  }

  // 2. Try OpenAI
  if (openaiKey && openaiKey.startsWith('sk-')) {
    try {
      const response = await callOpenAI(openaiKey, systemPrompt, userPrompt, temperature, responseFormat);
      return { success: true, provider: 'gpt-4o-mini', content: response };
    } catch (err) {
      console.warn('[LLM Client] OpenAI call failed:', err.message);
    }
  }

  // 3. Try Groq
  if (groqKey) {
    try {
      const response = await callGroq(groqKey, systemPrompt, userPrompt, temperature, responseFormat);
      return { success: true, provider: 'groq-llama3.3', content: response };
    } catch (err) {
      console.warn('[LLM Client] Groq call failed:', err.message);
    }
  }

  // 4. Return deterministic engine notice
  return {
    success: false,
    provider: 'smart_pedagogical_engine',
    reason: geminiKey || openaiKey ? 'API quota/network issue' : 'Running on Deep Pedagogical Knowledge Base'
  };
}

async function callGemini(apiKey, systemPrompt, userPrompt, temperature, responseFormat) {
  return callGeminiModel(apiKey, 'gemini-1.5-flash', systemPrompt, userPrompt, temperature, responseFormat);
}

async function callGeminiModel(apiKey, model, systemPrompt, userPrompt, temperature, responseFormat) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemPrompt}\n\nUser Question: ${userPrompt}` }
        ]
      }
    ],
    generationConfig: {
      temperature: temperature,
      maxOutputTokens: 2500,
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
    throw new Error(`Gemini API returned status ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

async function callOpenAI(apiKey, systemPrompt, userPrompt, temperature, responseFormat) {
  const url = 'https://api.openai.com/v1/chat/completions';
  
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const payload = {
    model: 'gpt-4o-mini',
    messages,
    temperature,
    response_format: responseFormat === 'json' ? { type: 'json_object' } : undefined
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
    throw new Error(`OpenAI API returned status ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGroq(apiKey, systemPrompt, userPrompt, temperature, responseFormat) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  const payload = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature,
    response_format: responseFormat === 'json' ? { type: 'json_object' } : undefined
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
    throw new Error(`Groq API returned status ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function testAPIKey(apiKey, provider = 'gemini') {
  try {
    if (provider === 'gemini') {
      const res = await callGemini(apiKey, 'You are a test agent.', 'Reply with OK', 0.1, 'text');
      return { success: true, message: 'Gemini API Key is valid and responsive!', provider: 'Google Gemini' };
    } else if (provider === 'openai') {
      const res = await callOpenAI(apiKey, 'You are a test agent.', 'Reply with OK', 0.1, 'text');
      return { success: true, message: 'OpenAI API Key is valid!', provider: 'OpenAI' };
    }
    return { success: false, message: 'Unknown provider' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export function isLLMConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY);
}
