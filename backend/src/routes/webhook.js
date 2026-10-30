import { Router } from 'express';
import { verifyWebhook, handleWebhook } from '../controllers/webhookController.js';
import { verifyWebhookSignature } from '../middleware/security.js';

const router = Router();

// Handshake verification from Meta
router.get('/', verifyWebhook);

// Incoming message handling with HMAC signature validation
router.post('/', verifyWebhookSignature, handleWebhook);

export default router;
