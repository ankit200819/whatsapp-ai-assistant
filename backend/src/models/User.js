import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: 'User' },
    preferences: {
      language: { type: String, default: 'en' },
    },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
