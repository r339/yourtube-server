import otp from "../Modals/otp.js";
import nodemailer from "nodemailer";

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendotp = async (req, res) => {
  const { identifier, type } = req.body; // identifier = email or phone; type = "email" | "sms"
  if (!identifier || !type) {
    return res.status(400).json({ message: "Identifier and type are required" });
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    // Remove any existing OTP for this identifier
    await otp.deleteMany({ identifier });

    const newOtp = new otp({ identifier, otp: code, type, expiresAt });
    await newOtp.save();

    if (type === "email") {
      // Send via nodemailer
      await transporter.sendMail({
        from: `"YourTube" <${process.env.EMAIL_USER}>`,
        to: identifier,
        subject: "YourTube — Your OTP Code",
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:8px">
            <h2 style="color:#ff0000">YourTube Login Verification</h2>
            <p>Your OTP code is:</p>
            <h1 style="letter-spacing:8px;color:#333">${code}</h1>
            <p style="color:#888;font-size:12px">This code expires in 10 minutes. Do not share it with anyone.</p>
          </div>`,
      });
    } else {
      // SMS via Fast2SMS (Indian SMS) — configure FAST2SMS_API_KEY in .env
      // Using fetch for HTTP request
      if (process.env.FAST2SMS_API_KEY) {
        await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: process.env.FAST2SMS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "q",
            message: `Your YourTube OTP is: ${code}. Valid for 10 minutes.`,
            language: "english",
            flash: 0,
            numbers: identifier,
          }),
        });
      } else {
        // Fallback: log to console in dev
        console.log(`[OTP SMS] To: ${identifier} | Code: ${code}`);
      }
    }

    return res.status(200).json({ sent: true, message: `OTP sent to ${identifier}` });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const verifyotp = async (req, res) => {
  const { identifier, code } = req.body;
  if (!identifier || !code) {
    return res.status(400).json({ message: "Identifier and code are required" });
  }
  try {
    const record = await otp.findOne({ identifier });
    if (!record) {
      return res.status(400).json({ message: "OTP not found or already used" });
    }
    if (record.expiresAt < new Date()) {
      await otp.deleteOne({ identifier });
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }
    if (record.otp !== code) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }
    // OTP correct — delete it
    await otp.deleteOne({ identifier });
    return res.status(200).json({ verified: true });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
