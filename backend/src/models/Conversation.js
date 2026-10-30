import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true }, // WhatsApp phone number
    title: { type: String, default: 'General Chat' },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
