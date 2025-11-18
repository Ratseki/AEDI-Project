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
    // ✅ FIX: Add Date.now() to prevent browser caching issues
    cb(null, `profile_${req.user.id}_${Date.now()}${ext}`);
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

// === Update user details (Dynamic & Safe) ===
router.put("/", authenticateToken, async (req, res) => {
  // ✅ FIX: Only update fields that are actually sent
  const { name, contact, gender, dob } = req.body;
  
  try {
    // Build the query dynamically
    let fields = [];
    let values = [];

    if (name) { fields.push("name=?"); values.push(name); }
    if (contact) { fields.push("contact=?"); values.push(contact); }
    if (gender) { fields.push("gender=?"); values.push(gender); }
    if (dob) { fields.push("dob=?"); values.push(dob); }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No changes provided." });
    }

    // Add the user ID for the WHERE clause
    values.push(req.user.id);

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id=?`;

    await dbPromise.query(sql, values);
    
    res.json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating profile" });
  }
});

// === Change password ===
router.put("/change-password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
  }

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

  // ✅ FIX: This new filename includes the timestamp from Multer storage
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