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

/** Send OTP email via nodemailer */
async function sendEmail(to, code) {
  await transporter.sendMail({
    from: `"YourTube" <${process.env.EMAIL_USER}>`,
    to,
    subject: "YourTube — Your OTP Code",
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:28px;border:1px solid #eee;border-radius:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <div style="background:#ff0000;border-radius:6px;padding:4px 8px">
            <span style="color:#fff;font-weight:700;font-size:16px">▶</span>
          </div>
          <span style="font-size:20px;font-weight:700;color:#0f0f0f">YourTube</span>
        </div>
        <h2 style="margin:0 0 8px;color:#0f0f0f;font-size:18px">Verify Your Identity</h2>
        <p style="color:#606060;margin:0 0 20px;font-size:14px">Use the code below to complete your login. It expires in 10 minutes.</p>
        <div style="background:#f9f9f9;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px">
          <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#0f0f0f;font-family:monospace">${code}</span>
        </div>
        <p style="color:#aaa;font-size:12px;margin:0">Never share this code with anyone. YourTube will never ask for it.</p>
      </div>`,
  });
}

/** Try Fast2SMS; returns true on success, false on failure */
async function sendSms(phone, code) {
  if (!process.env.FAST2SMS_API_KEY) return false;
  try {
    const resp = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message: `Your YourTube OTP is: ${code}. Valid for 10 minutes. Do not share.`,
        language: "english",
        flash: 0,
        numbers: phone,
      }),
    });
    const data = await resp.json();
    // Fast2SMS returns { return: true } on success
    return data?.return === true;
  } catch (err) {
    console.error("[Fast2SMS error]", err.message);
    return false;
  }
}

export const sendotp = async (req, res) => {
  // fallbackEmail: user's email address — used when SMS can't be sent
  const { identifier, type, fallbackEmail } = req.body;
  if (!identifier || !type) {
    return res.status(400).json({ message: "Identifier and type are required" });
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min TTL

  try {
    let deliveredVia = type;       // "email" | "sms"
    let storedIdentifier = identifier; // what we store in DB (used for verify)
    let deliveredTo = identifier;      // for the response message

    if (type === "email") {
      // ── Email OTP ─────────────────────────────────
      await sendEmail(identifier, code);
    } else {
      // ── SMS OTP (with email fallback) ──────────────
      const smsSent = await sendSms(identifier, code);

      if (!smsSent) {
        // SMS unavailable → fall back to email
        if (!fallbackEmail) {
          return res.status(400).json({
            message: "SMS service unavailable and no fallback email provided.",
          });
        }
        await sendEmail(fallbackEmail, code);
        deliveredVia = "email";
        storedIdentifier = fallbackEmail; // verify will use email now
        deliveredTo = fallbackEmail;
        console.log(`[OTP] SMS unavailable for ${identifier} — sent email to ${fallbackEmail}`);
      }
    }

    // Upsert OTP record using the resolved identifier
    await otp.deleteMany({ identifier: storedIdentifier });
    await new otp({ identifier: storedIdentifier, otp: code, type: deliveredVia, expiresAt }).save();

    return res.status(200).json({
      sent: true,
      deliveredVia,
      identifier: storedIdentifier, // frontend must use this for /verify
      message:
        deliveredVia === "sms"
          ? `OTP sent via SMS to ${deliveredTo}`
          : `OTP sent to email ${deliveredTo}`,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ message: "Failed to send OTP. Check server email config." });
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
      return res.status(400).json({ message: "OTP not found or already used. Request a new one." });
    }
    if (record.expiresAt < new Date()) {
      await otp.deleteOne({ identifier });
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }
    if (record.otp !== code) {
      return res.status(400).json({ message: "Incorrect OTP. Please try again." });
    }
    await otp.deleteOne({ identifier });
    return res.status(200).json({ verified: true });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Something went wrong during verification." });
  }
};
