import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { config } from '../src/config/env.js';
import { parseIncomingWebhook } from '../src/services/whatsappService.js';

test('GET /webhook handshake verifies valid token', async () => {
  const challenge = 'random_challenge_string_12345';
  const res = await request(app)
    .get('/webhook')
    .query({
      'hub.mode': 'subscribe',
      'hub.verify_token': config.whatsapp.verifyToken,
      'hub.challenge': challenge,
    });

  assert.equal(res.status, 200);
  assert.equal(res.text, challenge);
});

test('GET /webhook handshake rejects invalid token', async () => {
  const res = await request(app)
    .get('/webhook')
    .query({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'wrong_token',
      'hub.challenge': '12345',
    });

  assert.equal(res.status, 403);
});

test('parseIncomingWebhook correctly extracts text message', () => {
  const sampleMetaPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15550234567',
                phone_number_id: '1234567890',
              },
              contacts: [
                {
                  profile: { name: 'Alice Doe' },
                  wa_id: '15559876543',
                },
              ],
              messages: [
                {
                  from: '15559876543',
                  id: 'wamid.HBgLMTU1NTk4NzY1NDMVAgARGBI1QTEzOTVBM0MwREY5OEE4Nzc1AA==',
                  timestamp: '1730300000',
                  text: { body: 'Hello AI assistant!' },
                  type: 'text',
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const parsed = parseIncomingWebhook(sampleMetaPayload);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].from, '15559876543');
  assert.equal(parsed[0].name, 'Alice Doe');
  assert.equal(parsed[0].text, 'Hello AI assistant!');
  assert.ok(parsed[0].messageId.startsWith('wamid.'));
});

test('POST /webhook responds with 200 received immediately', async () => {
  const payload = {
    object: 'whatsapp_business_account',
    entry: [],
  };

  const res = await request(app)
    .post('/webhook')
    .send(payload);

  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'received');
});
