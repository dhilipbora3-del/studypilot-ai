import dotenv from 'dotenv';
dotenv.config();

/**
 * Universal LLM Client with graceful fallback to deterministic engine
 * Supports:
 * 1. Google Gemini API (GEMINI_API_KEY)
 * 2. OpenAI API (OPENAI_API_KEY)
 * 3. Graceful offline/deterministic mode if no key or API error
 */

export async function callLLM({ systemPrompt, userPrompt, temperature = 0.3, responseFormat = 'text' }) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      const response = await callGemini(geminiKey, systemPrompt, userPrompt, temperature, responseFormat);
      return { success: true, provider: 'gemini', content: response };
    } catch (err) {
      console.warn('[LLM Client] Gemini call failed, trying fallback or next provider:', err.message);
    }
  }

  if (openaiKey) {
    try {
      const response = await callOpenAI(openaiKey, systemPrompt, userPrompt, temperature, responseFormat);
      return { success: true, provider: 'openai', content: response };
    } catch (err) {
      console.warn('[LLM Client] OpenAI call failed:', err.message);
    }
  }

  // If no API key configured or network is unavailable
  return {
    success: false,
    provider: 'local_deterministic',
    reason: geminiKey || openaiKey ? 'API request failed' : 'No LLM API key configured (using local deterministic engine)'
  };
}

async function callGemini(apiKey, systemPrompt, userPrompt, temperature, responseFormat) {
  // Use gemini-1.5-flash or gemini-2.5-flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemPrompt}\n\nUser Request: ${userPrompt}` }
        ]
      }
    ],
    generationConfig: {
      temperature: temperature,
      maxOutputTokens: 2048,
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

export function isLLMConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
}
