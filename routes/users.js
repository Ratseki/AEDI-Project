require("dotenv").config(); // load .env
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { db, dbPromise } = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ===============================
// Multer Setup for Profile Pics
// ===============================
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, "../uploads/profile_pics");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// ===============================
// Register
// ===============================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPass = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPass, role || "customer"],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "User registered successfully", userId: result.insertId });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// Login
// ===============================
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ error: "User not found" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
    });
  });
});

// ===============================
// Get User Profile
// ===============================
router.get("/profile", authenticateToken, (req, res) => {
  db.query(
    "SELECT id, name, email, contact, profile_pic FROM users WHERE id = ?",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.json(rows[0]);
    }
  );
});

// ===============================
// Update Profile Info
// ===============================
router.put("/profile/update", authenticateToken, (req, res) => {
  const { name, email, contact } = req.body;
  db.query(
    "UPDATE users SET name = ?, email = ?, contact = ? WHERE id = ?",
    [name, email, contact, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Update failed" });
      res.json({ message: "Profile updated" });
    }
  );
});

// ===============================
// Change Password
// ===============================
router.put("/profile/password", authenticateToken, (req, res) => {
  const { oldPassword, newPassword } = req.body;

  db.query("SELECT password FROM users WHERE id = ?", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    const user = rows[0];
    if (!bcrypt.compareSync(oldPassword, user.password))
      return res.status(400).json({ message: "Old password incorrect" });

    const hashed = bcrypt.hashSync(newPassword, 10);
    db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, req.user.id], (err2) => {
      if (err2) return res.status(500).json({ message: "Update failed" });
      res.json({ message: "Password changed" });
    });
  });
});

// ===============================
// Upload Profile Picture
// ===============================
router.post("/profile/upload-pic", authenticateToken, upload.single("profile_pic"), (req, res) => {
  const filename = `/uploads/profile_pics/${req.file.filename}`;
  db.query("UPDATE users SET profile_pic = ? WHERE id = ?", [filename, req.user.id], (err) => {
    if (err) return res.status(500).json({ message: "Failed to update profile pic" });
    res.json({ message: "Profile picture updated", profile_pic: filename });
  });
});

module.exports = router;
