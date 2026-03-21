import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import nodemailer from "nodemailer";
import Razorpay from "razorpay";
import crypto from "crypto";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder",
});

const PLAN_PRICES = { bronze: 1000, silver: 5000, gold: 10000 }; // in paise (₹10, ₹50, ₹100)

export const login = async (req, res) => {
  const { email, name, image } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      const newUser = await users.create({ email, name, image });
      return res.status(201).json({ result: newUser });
    } else {
      existingUser.name = name || existingUser.name;
      existingUser.image = image || existingUser.image;
      await existingUser.save();
      return res.status(200).json({ result: existingUser });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description, phone } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const updatedata = await users.findByIdAndUpdate(
      _id,
      { $set: { channelname, description, ...(phone ? { phone } : {}) } },
      { new: true }
    );
    if (!updatedata) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getuserbyid = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  try {
    const user = await users.findById(_id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Create Razorpay order for plan upgrade
export const createplanorder = async (req, res) => {
  const { plan } = req.body;
  if (!["bronze", "silver", "gold", "premium"].includes(plan)) {
    return res.status(400).json({ message: "Invalid plan" });
  }
  const amount = plan === "premium" ? 9900 : PLAN_PRICES[plan]; // premium = ₹99
  try {
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `plan_${plan}_${Date.now()}`,
      notes: { plan },
    });
    return res.status(200).json({ order, key: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error("Create plan order error:", error);
    return res.status(500).json({ message: "Failed to create payment order" });
  }
};

// Verify payment and upgrade plan
export const upgradeplan = async (req, res) => {
  const {
    userid,
    plan,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userid)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    // Verify Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder")
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Upgrade user plan (set 30-day expiry)
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    const updatedUser = await users.findByIdAndUpdate(
      userid,
      { $set: { plan, planExpiry: expiry } },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    // Send invoice email
    const planPrices = { bronze: "₹10", silver: "₹50", gold: "₹100", premium: "₹99" };
    const planLimits = {
      bronze: "7 minutes per video",
      silver: "10 minutes per video",
      gold: "Unlimited watching + Unlimited downloads",
      premium: "Unlimited downloads",
    };

    await transporter.sendMail({
      from: `"YourTube" <${process.env.EMAIL_USER}>`,
      to: updatedUser.email,
      subject: `YourTube — ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Invoice`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:8px">
          <h2 style="color:#ff0000">YourTube — Payment Invoice</h2>
          <hr/>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#888">Customer</td><td style="padding:8px 0"><b>${updatedUser.name}</b></td></tr>
            <tr><td style="padding:8px 0;color:#888">Email</td><td style="padding:8px 0">${updatedUser.email}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Plan</td><td style="padding:8px 0"><b>${plan.toUpperCase()}</b></td></tr>
            <tr><td style="padding:8px 0;color:#888">Amount Paid</td><td style="padding:8px 0"><b>${planPrices[plan]}</b></td></tr>
            <tr><td style="padding:8px 0;color:#888">Benefits</td><td style="padding:8px 0">${planLimits[plan]}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Valid Until</td><td style="padding:8px 0">${expiry.toDateString()}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Payment ID</td><td style="padding:8px 0;font-family:monospace;font-size:12px">${razorpay_payment_id}</td></tr>
          </table>
          <hr/>
          <p style="color:#888;font-size:12px">Thank you for upgrading your YourTube plan! Enjoy your benefits.</p>
        </div>`,
    }).catch((e) => console.error("Email send error:", e));

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Upgrade plan error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
