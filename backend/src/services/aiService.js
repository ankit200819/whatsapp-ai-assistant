import { config } from '../config/env.js';

const SYSTEM_PROMPT = `You are a helpful, intelligent WhatsApp AI Assistant.
Provide clear, friendly, and concise answers suitable for WhatsApp messaging.
Keep responses easy to read, using bullet points or short paragraphs where appropriate.
If asked to write code, provide clean, concise snippets.`;

/**
 * Sends a chat prompt and recent history to Ollama
 * @param {Array<{role: string, content: string}>} history - Previous messages
 * @param {string} prompt - Current user message
 * @returns {Promise<string>} Assistant reply text
 */
export async function generateAiReply(history = [], prompt, customSystemPrompt = null) {
  const url = `${config.ai.ollamaBaseUrl}/api/chat`;
  const messages = [
    { role: 'system', content: customSystemPrompt || SYSTEM_PROMPT },
    ...history.slice(-8), // Keep recent context bounded to avoid token bloat
    { role: 'user', content: prompt },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.ai.timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.ai.ollamaModel,
        messages,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.message?.content?.trim() || 'No response generated.';
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('AI request timed out. Please try again.');
    }
    // Check if Ollama is unreachable
    if (err.cause?.code === 'ECONNREFUSED' || err.message.includes('fetch failed')) {
      throw new Error('Ollama service is not reachable on localhost:11434. Please ensure Ollama is running.');
    }
    throw err;
  }
}

/**
 * Checks if Ollama service is active and responsive
 */
export async function checkAiHealth() {
  try {
    const res = await fetch(`${config.ai.ollamaBaseUrl}/api/tags`, { method: 'GET' });
    if (!res.ok) return { healthy: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    const models = data.models?.map(m => m.name) || [];
    return {
      healthy: true,
      provider: 'ollama',
      configuredModel: config.ai.ollamaModel,
      availableModels: models,
      modelReady: models.some(m => m.includes(config.ai.ollamaModel.split(':')[0])),
    };
  } catch (err) {
    return { healthy: false, provider: 'ollama', error: err.message };
  }
}
