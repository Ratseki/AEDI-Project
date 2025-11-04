// routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { db } = require("../config/db"); // MySQL connection (adjust if your export differs)
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// -------------------------
// 🧍 Register
// -------------------------
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  const hashed = bcrypt.hashSync(password, 10);

  db.query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, hashed],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY")
          return res.status(400).json({ message: "Email already registered" });
        console.error("Register DB error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "User registered successfully" });
    }
  );
});

// -------------------------
// 🔑 Login
// -------------------------
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) {
      console.error("Login DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (results.length === 0)
      return res.status(401).json({ message: "User not found" });

    const user = results[0];
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role || "customer",
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Set httpOnly cookie (server-side)
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // set true in production with HTTPS
      sameSite: "lax",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
      path: "/",
    });

    // Return token + role for frontend convenience
    res.json({
      message: "Login successful",
      role: user.role,
      token,
    });
  });
});

// -------------------------
// 🔁 Forgot Password
// -------------------------
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) {
      console.error("Forgot password DB error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (results.length === 0) return res.status(404).json({ message: "No account found" });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour

    db.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?",
      [token, expires, email],
      (err2) => {
        if (err2) {
          console.error("Failed to save reset token:", err2);
          return res.status(500).json({ message: "Database update failed" });
        }

        const resetLink = `http://localhost:3000/reset-password.html?token=${token}`;

        // nodemailer transporter (Gmail example)
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
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
          `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Email send failed:", error);
            return res.status(500).json({ message: "Failed to send email", error: error.message });
          }
          res.json({ message: "Password reset link sent to your email!" });
        });
      }
    );
  });
});

// -------------------------
// 🔒 Reset Password
// -------------------------
router.post("/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ message: "Token and new password are required" });

  db.query(
    "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
    [token],
    (err, results) => {
      if (err) {
        console.error("Reset password DB error:", err);
        return res.status(500).json({ message: "Database error" });
      }
      if (results.length === 0) return res.status(400).json({ message: "Invalid or expired token" });

      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      db.query(
        "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = ?",
        [hashedPassword, token],
        (err2) => {
          if (err2) {
            console.error("Failed to update password:", err2);
            return res.status(500).json({ message: "Database update failed" });
          }
          res.json({ message: "Password successfully reset!" });
        }
      );
    }
  );
});

// -------------------------
// ✅ Verify token (cookie OR Authorization header)
// -------------------------
router.get("/verify", (req, res) => {
  try {
    // prefer cookie, fallback to Authorization header
    let token = req.cookies?.token;
    if (!token) {
      const authHeader = req.headers["authorization"] || req.headers["Authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) return res.status(401).json({ valid: false, message: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ valid: true, user: decoded });
  } catch (err) {
    console.error("Token verify failed:", err);
    return res.status(401).json({ valid: false, message: "Invalid or expired token" });
  }
});

const authenticateToken = require("../middleware/authMiddleware");

// -------------------------
// 👤 Get user profile (protected)
// -------------------------
router.get("/profile", authenticateToken, (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Not authenticated" });

  db.query("SELECT id, name, email, role FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) {
      console.error("Profile DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results[0] || {});
  });
});

module.exports = router;
