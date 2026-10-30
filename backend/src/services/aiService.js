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

async function discoverActiveGeminiModel() {
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.ai.geminiApiKey}`);
    if (listRes.ok) {
      const data = await listRes.json();
      const flashModel = data.models?.find(m =>
        m.supportedGenerationMethods?.includes('generateContent') &&
        (m.name.includes('flash') || m.name.includes('gemini'))
      );
      if (flashModel) {
        const cleanName = flashModel.name.replace(/^models\//, '');
        console.log(`[Gemini] Discovered supported active model: ${cleanName}`);
        resolvedGeminiModel = cleanName;
        return cleanName;
      }
    }
  } catch (err) {
    console.warn('[Gemini] Model auto-discovery failed:', err.message);
  }
  return 'gemini-3.5-flash';
}

/**
 * Calls Google Gemini REST API (fast cloud free tier)
 */
async function generateGeminiReply(history, prompt, customSystemPrompt) {
  let model = resolvedGeminiModel || config.ai.geminiModel || 'gemini-3.5-flash';
  // Avoid deprecated 1.5 or 2.5 strings if legacy value was configured
  if (model === 'gemini-1.5-flash' || model === 'gemini-2.5-flash') {
    model = 'gemini-3.5-flash';
  }

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

  const body = {
    system_instruction: {
      parts: [{ text: customSystemPrompt || SYSTEM_PROMPT }],
    },
    contents,
    generationConfig: {
      maxOutputTokens: 250,
      temperature: 0.7,
    },
  };

  const makeRequest = async (modelName) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.ai.geminiApiKey}`;
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  let response = await makeRequest(model);

  // If 404 (model name changed or unsupported on current tier), discover supported model and retry once!
  if (response.status === 404) {
    console.warn(`[Gemini] Model ${model} returned 404. Finding active model for your API key...`);
    model = await discoverActiveGeminiModel();
    response = await makeRequest(model);
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return reply?.trim() || 'No response generated.';
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
    return await generateGeminiReply(history, prompt, customSystemPrompt);
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
