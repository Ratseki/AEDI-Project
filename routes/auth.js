const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { db, pool } = require("../config/db");  // MySQL connection

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";


// 🧍 Register
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  const hashed = bcrypt.hashSync(password, 10);

  db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashed],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY")
          return res.status(400).json({ message: "Email already registered" });
        return res.status(500).json({ error: err });
      }
      res.json({ message: "User registered successfully" });
    }
  );
});

// 🔑 Login (Production Ready)
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0)
      return res.status(401).json({ message: "User not found" });

    const user = results[0];
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // auth.js -> login route
    res.cookie("token", token, {
    httpOnly: true,
    secure: false,      // must be false for localhost
    sameSite: "lax",    // works for same-origin
    maxAge: 2*60*60*1000,
    path: "/"
  });




    // ✅ Send confirmation (token still returned for debugging)
    res.json({
      message: "Login successful",
      role: user.role,
      token, // optional (can remove later)
      cookieSent: !!req.headers.cookie
    });
  });
});



const nodemailer = require("nodemailer");
const crypto = require("crypto");


// 🔁 Forgot Password - Generate Token & Send Email
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  console.log("📧 Forgot Password Request Received");
  console.log("📧 Email to send:", email);
  console.log("📦 Env EMAIL_USER:", process.env.EMAIL_USER);
  console.log("📦 Env EMAIL_PASS:", process.env.EMAIL_PASS ? "(hidden)" : "❌ MISSING");

  if (!email) {
    console.warn("⚠️ No email provided");
    return res.status(400).json({ message: "Email is required" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    if (results.length === 0) {
      console.warn("⚠️ No account found with this email");
      return res.status(404).json({ message: "No account found with this email" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour

    db.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?",
      [token, expires, email],
      (err2) => {
        if (err2) {
          console.error("❌ Failed to update reset token:", err2);
          return res.status(500).json({ message: "Database update failed", error: err2 });
        }

        const resetLink = `http://localhost:3000/reset-password.html?token=${token}`;
        console.log("🔗 Reset link generated:", resetLink);

        // ✉️ Configure mailer
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const mailOptions = {
          from: `"Profilepicmultimedia" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Password Reset Request",
          html: `
            <h2>Password Reset</h2>
            <p>You requested a password reset. Click below to reset your password:</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>This link will expire in 1 hour.</p>
          `
        };

        console.log("📤 Attempting to send email...");

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("❌ Email send failed:", error);
            return res.status(500).json({ message: "Failed to send email", error: error.message });
          }
          console.log("✅ Email sent successfully:", info.response);
          res.json({ message: "Password reset link sent to your email!" });
        });
      }
    );
  });
});


// 🔒 Reset Password
router.post("/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  console.log("🔑 Reset Password Request Received");
  console.log("🧩 Token:", token ? "(provided)" : "❌ missing");
  console.log("🔒 New password:", newPassword ? "(provided)" : "❌ missing");

  if (!token || !newPassword)
    return res.status(400).json({ message: "Token and new password are required" });

  db.query(
    "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
    [token],
    (err, results) => {
      if (err) {
        console.error("❌ Database error (reset-password):", err);
        return res.status(500).json({ message: "Database error", error: err });
      }

      if (results.length === 0) {
        console.warn("⚠️ Invalid or expired token");
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      console.log("🔒 Password hashed successfully");

      db.query(
        "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = ?",
        [hashedPassword, token],
        (err) => {
          if (err) {
            console.error("❌ Failed to update password:", err);
            return res.status(500).json({ message: "Database update failed", error: err });
          }
          console.log("✅ Password reset successful for token:", token);
          res.json({ message: "Password successfully reset!" });
        }
      );
    }
  );
});

// Verify Token (GET /api/auth/verify)
router.get("/verify", (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ valid: false, message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    console.error("Token verify failed:", err);
    res.status(401).json({ valid: false, message: "Invalid or expired token" });
  }
});

const User = require('../models/User'); // adjust path if needed


// 👤 Get user profile (protected) authenticateToken
const authenticateToken = require("../middleware/authMiddleware");
router.get("/profile", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query("SELECT id, name, email FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results[0]);
  });
});

module.exports = router;
