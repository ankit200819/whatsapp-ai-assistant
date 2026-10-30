import { config } from '../config/env.js';
import { parseIncomingWebhook, sendWhatsAppMessage } from '../services/whatsappService.js';
import { generateAiReply } from '../services/aiService.js';
import { isDuplicateMessage, markMessageProcessed, getConversationHistory, saveMessage } from '../services/memoryService.js';

/**
 * Handles WhatsApp Cloud API Webhook verification handshake (GET /webhook)
 */
export function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    console.log('[Webhook] Handshake verified successfully.');
    return res.status(200).send(challenge);
  }

  console.warn('[Webhook] Verification handshake failed. Invalid token.');
  return res.status(403).json({ error: 'Verification token mismatch' });
}

/**
 * Handles incoming WhatsApp Cloud API messages and events (POST /webhook)
 */
export async function handleWebhook(req, res) {
  // Acknowledge receipt to Meta immediately within 3s window
  res.status(200).json({ status: 'received' });

  const messages = parseIncomingWebhook(req.body);
  if (!messages.length) return;

  for (const msg of messages) {
    try {
      // 1. Deduplication check
      if (await isDuplicateMessage(msg.messageId)) {
        console.log(`[Webhook] Duplicate message ID ignored: ${msg.messageId}`);
        continue;
      }
      markMessageProcessed(msg.messageId);

      console.log(`[Webhook] Message from ${msg.name} (${msg.from}): "${msg.text}"`);

      // 2. Fetch context
      const history = await getConversationHistory(msg.from);

      // 3. Save incoming message
      await saveMessage(msg.from, 'user', msg.text, msg.messageId);

      // 4. Generate AI reply
      const aiReply = await generateAiReply(history, msg.text);

      // 5. Send outbound reply via WhatsApp
      await sendWhatsAppMessage(msg.from, aiReply);

      // 6. Save assistant reply
      await saveMessage(msg.from, 'assistant', aiReply);

      console.log(`[Webhook] Successfully replied to ${msg.from}`);
    } catch (err) {
      console.error(`[Webhook] Processing failed for message from ${msg.from}:`, err.message);
    }
  }
}
