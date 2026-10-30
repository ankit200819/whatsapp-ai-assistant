import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;

export async function connectDatabase() {
  if (!config.mongodbUri) {
    console.warn('[Database] MONGODB_URI not provided. Running in in-memory/offline fallback mode.');
    return false;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log('[Database] Connected successfully to MongoDB.');
    return true;
  } catch (error) {
    console.warn(`[Database] MongoDB connection failed (${error.message}). Continuing in fallback mode.`);
    isConnected = false;
    return false;
  }
}

export function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}
