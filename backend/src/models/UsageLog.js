import mongoose from 'mongoose';

const usageLogSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['webhook', 'chat', 'error'], required: true },
    userId: { type: String, default: null },
    status: { type: String, enum: ['success', 'error', 'duplicate'], default: 'success' },
    details: { type: Object, default: {} },
    responseTimeMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const UsageLog = mongoose.models.UsageLog || mongoose.model('UsageLog', usageLogSchema);
