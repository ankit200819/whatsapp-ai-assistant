import { config } from '../config/env.js';

const SYSTEM_PROMPT = `Your name is Qwen. You are a helpful, respectful AI assistant for WhatsApp.
You are assisting Maurya ji. Always address the user respectfully as "Maurya ji".
When greeted with "hi", "hello", or similar greetings, reply: "hii i am qwen and how can i help you maurya ji".

Format all responses specifically for mobile WhatsApp reading:
- Keep answers concise, snappy, and readable on a smartphone screen (1-3 short paragraphs max).
- Use *bold* for key terms.
- Use bullet points with clean spacing so it's easy to skim on mobile.
- Avoid large text walls.`;

let resolvedGeminiModel = null;

// Free-tier resilient waterfall: lite models have much higher daily request quotas
const FREE_TIER_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
];

/**
 * Calls Google Gemini REST API (fast cloud free tier with auto-fallback on 429 quota exhaustion)
 */
async function generateGeminiReply(history, prompt, customSystemPrompt) {
  const preferredModel = resolvedGeminiModel || config.ai.geminiModel || 'gemini-3.5-flash-lite';
  const candidateModels = [
    preferredModel,
    ...FREE_TIER_MODELS,
  ].filter((m, i, arr) => m && arr.indexOf(m) === i && !m.includes('1.5') && !m.includes('2.5') && m !== 'gemini-3.6-flash');

  // Map history to Gemini format (user -> "user", assistant -> "model")
  const contents = [];
  for (const msg of history.slice(-6)) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }
  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  const makeBody = (modelName) => {
    const generationConfig = {
      maxOutputTokens: 2048,
      temperature: 0.7,
    };
    // Lite models do not support thinkingConfig; standard flash models need thinkingBudget: 0 to prevent cutoff
    if (!modelName.includes('lite') && !modelName.includes('gemma')) {
      generationConfig.thinkingConfig = { thinkingBudget: 0 };
    }

    return {
      system_instruction: {
        parts: [{ text: customSystemPrompt || SYSTEM_PROMPT }],
      },
      contents,
      generationConfig,
    };
  };

  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.ai.geminiApiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(makeBody(modelName)),
      });

      if (response.ok) {
        resolvedGeminiModel = modelName;
        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const reply = parts.map(p => p.text).filter(Boolean).join('\n');
        if (reply?.trim()) return reply.trim();
      }

      const errText = await response.text();
      console.warn(`[Gemini] Model ${modelName} returned ${response.status}: ${errText.slice(0, 140)}`);
      lastError = new Error(`Gemini API error (${response.status}) on ${modelName}: ${errText}`);

      // If quota exceeded (429), model unsupported/deprecated (404), or busy (503), try next free model
      if (![429, 404, 503].includes(response.status)) {
        throw lastError;
      }
    } catch (err) {
      lastError = err;
      if (err.message?.includes('Gemini API error') && ![429, 404, 503].some(code => err.message.includes(`(${code})`))) {
        throw err;
      }
    }
  }

  throw lastError || new Error('All free Gemini models exhausted or unavailable.');
}

/**
 * Calls local Ollama (local free offline)
 */
async function generateOllamaReply(history, prompt, customSystemPrompt) {
  const url = `${config.ai.ollamaBaseUrl}/api/chat`;
  const messages = [
    { role: 'system', content: customSystemPrompt || SYSTEM_PROMPT },
    ...history.slice(-6),
    { role: 'user', content: prompt },
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ai.ollamaModel,
      messages,
      stream: false,
      options: {
        num_predict: 120, // Limit tokens for 3x faster local response
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.message?.content?.trim() || 'No response generated.';
}

/**
 * Main AI reply entry point
 */
export async function generateAiReply(history = [], prompt, customSystemPrompt = null) {
  const trimmed = prompt.trim().toLowerCase();
  // Instant greeting shortcut requested by user: zero latency
  if (/^(hi+|hello|hey|namaste)\b/i.test(trimmed) && trimmed.split(/\s+/).length <= 2) {
    return 'hii i am qwen and how can i help you maurya ji';
  }

  // Use Gemini if API key is configured or provider is gemini
  if (config.ai.geminiApiKey) {
    try {
      return await generateGeminiReply(history, prompt, customSystemPrompt);
    } catch (geminiErr) {
      console.warn('[AI] Gemini models unavailable, attempting Ollama fallback:', geminiErr.message);
      try {
        return await generateOllamaReply(history, prompt, customSystemPrompt);
      } catch {
        throw geminiErr;
      }
    }
  }

  // Fallback to local Ollama
  return await generateOllamaReply(history, prompt, customSystemPrompt);
}

/**
 * Checks active AI engine status
 */
export async function checkAiHealth() {
  if (config.ai.geminiApiKey) {
    return {
      healthy: true,
      provider: 'gemini',
      configuredModel: config.ai.geminiModel,
      speed: 'ultra-fast (~1s cloud)',
      cost: '100% Free (Google AI Studio)',
    };
  }

  // Check Ollama
  try {
    const res = await fetch(`${config.ai.ollamaBaseUrl}/api/tags`, { method: 'GET' });
    if (!res.ok) return { healthy: false, provider: 'ollama', error: `HTTP ${res.status}` };
    const data = await res.json();
    const models = data.models?.map(m => m.name) || [];
    return {
      healthy: true,
      provider: 'ollama',
      configuredModel: config.ai.ollamaModel,
      availableModels: models,
      speed: 'local CPU (~7s)',
      tip: 'Add GEMINI_API_KEY to backend/.env for instant ~1s replies!',
    };
  } catch (err) {
    return { healthy: false, provider: 'ollama', error: err.message };
  }
}
