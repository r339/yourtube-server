import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

// Upgrade plan — called after successful custom payment on frontend
export const upgradeplan = async (req, res) => {
  const { userid, plan } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userid)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  if (!["bronze", "silver", "gold", "premium"].includes(plan)) {
    return res.status(400).json({ message: "Invalid plan" });
  }

  try {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    const updatedUser = await users.findByIdAndUpdate(
      userid,
      { $set: { plan, planExpiry: expiry } },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    // Generate a simple transaction ID
    const txnId = "TXN" + crypto.randomBytes(6).toString("hex").toUpperCase();

    const planPrices = { bronze: "₹10", silver: "₹50", gold: "₹100", premium: "₹99" };
    const planLimits = {
      bronze: "7 minutes per video",
      silver: "10 minutes per video",
      gold: "Unlimited watching + Unlimited downloads",
      premium: "Unlimited downloads",
    };

    // Send invoice email
    await transporter.sendMail({
      from: `"YourTube" <${process.env.EMAIL_USER}>`,
      to: updatedUser.email,
      subject: `YourTube — ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Invoice`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:8px">
          <h2 style="color:#ff0000">YourTube — Payment Invoice</h2>
          <hr/>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#888">Customer</td><td><b>${updatedUser.name}</b></td></tr>
            <tr><td style="padding:8px 0;color:#888">Email</td><td>${updatedUser.email}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Plan</td><td><b>${plan.toUpperCase()}</b></td></tr>
            <tr><td style="padding:8px 0;color:#888">Amount Paid</td><td><b>${planPrices[plan]}</b></td></tr>
            <tr><td style="padding:8px 0;color:#888">Benefits</td><td>${planLimits[plan]}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Valid Until</td><td>${expiry.toDateString()}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Transaction ID</td><td style="font-family:monospace;font-size:12px">${txnId}</td></tr>
          </table>
          <hr/>
          <p style="color:#888;font-size:12px">Thank you for upgrading your YourTube plan!</p>
        </div>`,
    }).catch((e) => console.error("Invoice email error:", e));

    return res.status(200).json({ success: true, user: updatedUser, txnId });
  } catch (error) {
    console.error("Upgrade plan error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
