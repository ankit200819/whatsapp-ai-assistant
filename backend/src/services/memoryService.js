import { isDbConnected } from '../config/database.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';

// In-memory fallback map: userId -> Array<{ role: string, content: string, timestamp: Date }>
const memoryCache = new Map();
// Cache of processed message IDs to prevent duplicates
const processedMessageIds = new Set();

/**
 * Checks if a WhatsApp message ID has already been processed
 * @param {string} messageId - The wamid.* ID
 * @returns {Promise<boolean>}
 */
export async function isDuplicateMessage(messageId) {
  if (!messageId) return false;

  if (processedMessageIds.has(messageId)) {
    return true;
  }

  if (isDbConnected()) {
    try {
      const existing = await Message.findOne({ messageId });
      if (existing) {
        processedMessageIds.add(messageId);
        return true;
      }
    } catch {
      // Fallback to in-memory set
    }
  }

  return false;
}

/**
 * Marks a message ID as processed
 * @param {string} messageId
 */
export function markMessageProcessed(messageId) {
  if (messageId) {
    processedMessageIds.add(messageId);
    // Keep set bounded to last 2000 items
    if (processedMessageIds.size > 2000) {
      const first = processedMessageIds.values().next().value;
      processedMessageIds.delete(first);
    }
  }
}

/**
 * Retrieves recent message history for a user
 * @param {string} userId - User phone number or identifier
 * @param {number} limit - Maximum messages to return
 * @returns {Promise<Array<{role: string, content: string}>>}
 */
export async function getConversationHistory(userId, limit = 8) {
  if (isDbConnected()) {
    try {
      const conv = await Conversation.findOne({ userId });
      if (conv) {
        const msgs = await Message.find({ conversationId: conv._id.toString() })
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
        return msgs.reverse().map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));
      }
    } catch (err) {
      console.warn('[MemoryService] DB query failed, using in-memory store:', err.message);
    }
  }

  const list = memoryCache.get(userId) || [];
  return list.slice(-limit).map(m => ({ role: m.role, content: m.content }));
}

/**
 * Saves a new turn (user and/or assistant message)
 * @param {string} userId
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content
 * @param {string|null} messageId
 */
export async function saveMessage(userId, role, content, messageId = null) {
  if (messageId) markMessageProcessed(messageId);

  // In-memory update
  if (!memoryCache.has(userId)) memoryCache.set(userId, []);
  const list = memoryCache.get(userId);
  list.push({ role, content, timestamp: new Date(), messageId });
  if (list.length > 50) list.shift();

  // MongoDB update if active
  if (isDbConnected()) {
    try {
      let conv = await Conversation.findOne({ userId });
      if (!conv) {
        conv = await Conversation.create({ userId, title: `Chat with ${userId}` });
      }
      await Message.create({
        conversationId: conv._id.toString(),
        sender: role,
        content,
        messageId: messageId || undefined,
      });
      conv.messageCount = (conv.messageCount || 0) + 1;
      await conv.save();
    } catch (err) {
      console.warn('[MemoryService] Failed to persist message to DB:', err.message);
    }
  }
}

/**
 * Clears conversation history for a user
 * @param {string} userId
 */
export async function clearConversationHistory(userId) {
  memoryCache.delete(userId);
  if (isDbConnected()) {
    try {
      const conv = await Conversation.findOne({ userId });
      if (conv) {
        await Message.deleteMany({ conversationId: conv._id.toString() });
        conv.messageCount = 0;
        await conv.save();
      }
    } catch (err) {
      console.warn('[MemoryService] DB clear failed:', err.message);
    }
  }
}
