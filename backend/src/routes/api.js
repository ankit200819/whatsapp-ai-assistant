import { Router } from 'express';
import { sendChatMessage, getChatHistory, clearChatHistory, getSystemHealth } from '../controllers/chatController.js';
import { simpleRateLimiter } from '../middleware/security.js';

const router = Router();

router.get('/health', getSystemHealth);
router.post('/chat', simpleRateLimiter(60000, 30), sendChatMessage);
router.get('/chat/history', getChatHistory);
router.delete('/chat/history', clearChatHistory);

export default router;
