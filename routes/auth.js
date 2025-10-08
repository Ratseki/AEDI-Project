const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models/User"); // MySQL connection

const router = express.Router();
const JWT_SECRET = "supersecretkey";

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

// 🔑 Login
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
  { id: user.id, name: user.name, email: user.email },
  JWT_SECRET,
  { expiresIn: "2h" }
);
    res.json({ message: "Login successful", token });
  });
});

// Verify Token (GET /api/auth/verify)
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ valid: false, message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // same key
    res.json({
      valid: true,
      user: {
        id: decoded.id,
        name: decoded.name,   // ✅ added name
        email: decoded.email
      }
    });
  } catch (err) {
    console.error("Token verify failed:", err);
    res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  }
});



const User = require('../models/User'); // adjust path if needed


// 👤 Get user profile (protected)
const authenticateToken = require("../middleware/authMiddleware");
router.get("/profile", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query("SELECT id, name, email FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results[0]);
  });
});

module.exports = router;
