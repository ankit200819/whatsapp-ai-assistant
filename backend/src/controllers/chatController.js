import { generateAiReply, checkAiHealth } from '../services/aiService.js';
import { getConversationHistory, saveMessage, clearConversationHistory } from '../services/memoryService.js';
import { isDbConnected } from '../config/database.js';
import { config } from '../config/env.js';

export async function sendChatMessage(req, res, next) {
  try {
    const { message, userId = 'web_user', systemPrompt } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const trimmed = message.trim();
    if (trimmed.length > 2000) {
      return res.status(400).json({ error: 'Message exceeds maximum length of 2000 characters.' });
    }

    const history = await getConversationHistory(userId);
    await saveMessage(userId, 'user', trimmed);

    const reply = await generateAiReply(history, trimmed, systemPrompt);
    await saveMessage(userId, 'assistant', reply);

    return res.status(200).json({
      success: true,
      reply,
      userId,
    });
  } catch (err) {
    next(err);
  }
}

export async function getChatHistory(req, res, next) {
  try {
    const userId = req.query.userId || 'web_user';
    const history = await getConversationHistory(userId, 20);
    return res.status(200).json({ success: true, userId, history });
  } catch (err) {
    next(err);
  }
}

export async function clearChatHistory(req, res, next) {
  try {
    const userId = req.query.userId || 'web_user';
    await clearConversationHistory(userId);
    return res.status(200).json({ success: true, message: `History cleared for ${userId}` });
  } catch (err) {
    next(err);
  }
}

export async function getSystemHealth(req, res) {
  const aiHealth = await checkAiHealth();

  return res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: {
        connected: isDbConnected(),
        mode: isDbConnected() ? 'mongodb' : 'in-memory-fallback',
      },
      ai: aiHealth,
      whatsapp: {
        configured: Boolean(config.whatsapp.accessToken && config.whatsapp.phoneNumberId),
        mode: Boolean(config.whatsapp.accessToken && config.whatsapp.phoneNumberId) ? 'cloud_api' : 'mock_test_mode',
      },
    },
  });
}
