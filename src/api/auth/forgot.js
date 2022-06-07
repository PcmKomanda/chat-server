// Imports
const express = require("express");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Create router.
const router = express.Router();

// Models.
const User = require("../../database/models/user");
const Session = require("../../database/models/session");

// Mail transporter
const transporter = nodemailer.createTransport({
  host: process.env.SENDER_SMTP_HOST,
  port: process.env.SENDER_PORT || 587,
  auth: {
    user: process.env.SENDER_USER,
    pass: process.env.SENDER_PASS,
  },
});
// Route that will be used to send a otp to email.
router.get("/", async (req, res) => {
  // Set constant for creds.
  const { creds } = req.query;

  // Find user by email or login_name and if not found send error message to client.
  const user = await User.findOne({
    $or: [{ email: creds.toLowerCase() }, { login_name: creds.toLowerCase() }],
  });
  if (!user) {
    res.send({ error: "Vartotojas nerastas!" });
    return;
  }

  // Generate new password.
  const genpass = Math.random().toString(36).slice(-8);

  // Send email to user.
  await transporter.sendMail({
    from: process.env.SENDER_FROM_EMAIL,
    to: user.email,
    subject: "Vienkartinis slaptažodis!",
    html: `Buvo sugeneruotas jūsų vienkartinis slaptažodis. Slaptažodis: <strong>${genpass}</strong>`,
  });

  // Set generated password as one time password.
  await User.findOneAndUpdate(
    { email: user.email },
    {
      otp: genpass,
    }
  );
  // Send success message to client.
  res.send({
    message:
      "Pasižiūrėkite savo el. paštą! Nepamirškite pažiūrėti šlamšto (angl. spam) aplankalo.",
  });
});

router.get("/otplogin", async (req, res) => {
  // Set constant for otp.
  const { otp } = req.query;

  // Find user by otp.
  const user = await User.findOne({ otp });
  if (!user) {
    res.send({ error: "Vienkartinis slaptažodis netinkamas." });
    return;
  }

  // After success remove otp.
  await User.findOneAndUpdate({ _id: user._id }, { otp: "" });

  // Create token and send it to client.
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "168h",
  });

  // Create new session.
  await Session.create({
    user_id: user._id,
    tokenHash: token,
  });

  res.send({ token });
});

router.post("/change", async (req, res) => {
  const { token } = req.query;
  const { new_pass } = req.body;
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET) || false;

    // Hash password.
    const salt = await bcrypt.genSalt(5);
    const hashedPassword = await bcrypt.hash(new_pass, salt);

    // Update password.
    await User.findOneAndUpdate({ _id: id }, { password: hashedPassword });

    res.send({ message: "Slaptažodis buvo pakeistas. 😇" });
  } catch (err) {
    res.send({ error: "Įvyko klaida. Bandykite dar kartą. 😕" });
  }
});

// Export router.
module.exports = router;
