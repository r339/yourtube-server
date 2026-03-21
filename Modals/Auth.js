import mongoose from "mongoose";

const userschema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },
  phone: { type: String, default: "" },
  plan: { type: String, enum: ["free", "bronze", "silver", "gold", "premium"], default: "free" },
  planExpiry: { type: Date, default: null },
  downloadsToday: { type: Number, default: 0 },
  lastDownloadDate: { type: Date, default: null },
  otpVerified: { type: Boolean, default: false },
  joinedon: { type: Date, default: Date.now },
});

export default mongoose.model("user", userschema);
