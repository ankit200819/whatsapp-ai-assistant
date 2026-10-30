import { config } from '../config/env.js';

/**
 * Parses an incoming WhatsApp Cloud API webhook body
 * @param {object} body - Webhook JSON body
 * @returns {Array<{messageId: string, from: string, name: string, text: string, timestamp: string}>}
 */
export function parseIncomingWebhook(body) {
  const messages = [];

  if (body?.object !== 'whatsapp_business_account' || !Array.isArray(body.entry)) {
    return messages;
  }

  for (const entry of body.entry) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (!value || !value.messages) continue;

      const contacts = value.contacts || [];
      const contactMap = Object.fromEntries(contacts.map(c => [c.wa_id, c.profile?.name || 'User']));

      for (const msg of value.messages) {
        // We only extract supported text messages in MVP
        if (msg.type === 'text' && msg.text?.body) {
          messages.push({
            messageId: msg.id,
            from: msg.from,
            name: contactMap[msg.from] || 'User',
            text: msg.text.body.trim(),
            timestamp: msg.timestamp,
          });
        }
      }
    }
  }

  return messages;
}

/**
 * Sends a text message to a user via WhatsApp Cloud API
 * @param {string} to - Recipient phone number (e.g. "15551234567")
 * @param {string} text - Message content to send
 * @returns {Promise<object>}
 */
export async function sendWhatsAppMessage(to, text) {
  const { accessToken, phoneNumberId, apiVersion } = config.whatsapp;

  // Graceful test mock mode when running without real Meta credentials
  if (!accessToken || !phoneNumberId) {
    console.log(`[WhatsApp Mock Outbound] -> To: ${to} | Text: "${text}"`);
    return { mock: true, recipient: to, text, status: 'simulated_sent' };
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`WhatsApp API error (${response.status}): ${errorData}`);
  }

  return await response.json();
}
