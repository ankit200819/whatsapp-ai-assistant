import crypto from 'crypto';
import { config } from '../config/env.js';

/**
 * Middleware to verify WhatsApp Cloud API webhook signature (x-hub-signature-256)
 */
export function verifyWebhookSignature(req, res, next) {
  // If appSecret is not configured, skip signature check for local testing
  if (!config.whatsapp.appSecret) {
    return next();
  }

  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    return res.status(401).json({ error: 'Missing x-hub-signature-256 header' });
  }

  const elements = signature.split('=');
  const expectedSignature = elements[1];

  const hmac = crypto.createHmac('sha256', config.whatsapp.appSecret);
  // req.rawBody is captured by express.json verify hook
  const calculatedSignature = hmac.update(req.rawBody || JSON.stringify(req.body)).digest('hex');

  if (expectedSignature !== calculatedSignature) {
    return res.status(403).json({ error: 'Invalid webhook signature' });
  }

  next();
}

/**
 * Simple in-memory rate limiter middleware
 */
const rateLimitMap = new Map();
export function simpleRateLimiter(windowMs = 60000, maxRequests = 60) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count = 1;
      entry.resetAt = now + windowMs;
    } else {
      entry.count += 1;
    }

    rateLimitMap.set(ip, entry);

    if (entry.count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    }

    next();
  };
}
