const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const { dbPromise } = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

// === Ensure upload folder exists ===
const uploadDir = path.join(__dirname, "../uploads/profile_pics");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// === Multer Setup for Profile Picture Upload ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile_${req.user.id}${ext}`);
  },
});
const upload = multer({ storage });

// === Get user profile ===
router.get("/", authenticateToken, async (req, res) => {
  try {
    const [rows] = await dbPromise.query(
      "SELECT id, name, email, contact, gender, dob, profile_pic FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// === Update user details ===
router.put("/", authenticateToken, async (req, res) => {
  const { name, contact, gender, dob } = req.body;
  try {
    await dbPromise.query(
      "UPDATE users SET name=?, contact=?, gender=?, dob=? WHERE id=?",
      [name, contact, gender, dob, req.user.id]
    );
    res.json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating profile" });
  }
});

// === Change password ===
router.put("/change-password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const [rows] = await dbPromise.query("SELECT password FROM users WHERE id=?", [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(400).json({ message: "Current password incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await dbPromise.query("UPDATE users SET password=? WHERE id=?", [hashed, req.user.id]);

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error changing password" });
  }
});

// === Upload Profile Picture ===
router.post("/upload-pic", authenticateToken, upload.single("profile_pic"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filePath = `/uploads/profile_pics/${req.file.filename}`;
  try {
    await dbPromise.query("UPDATE users SET profile_pic=? WHERE id=?", [filePath, req.user.id]);
    res.json({ message: "Profile picture updated.", path: filePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving profile picture" });
  }
});

module.exports = router;
