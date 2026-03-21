import mongoose from "mongoose";

const otpSchema = mongoose.Schema({
  identifier: { type: String, required: true }, // email or phone
  otp: { type: String, required: true },
  type: { type: String, enum: ["email", "sms"], required: true },
  expiresAt: { type: Date, required: true },
});

// Auto-expire documents after their expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("otp", otpSchema);
