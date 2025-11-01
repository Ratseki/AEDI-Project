const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { db, dbPromise } = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const JWT_SECRET = "your_secret_key";

// Register
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body; // include role
  const hashedPass = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashedPass, role || "customer"], // default to 'customer'
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "User registered successfully", userId: result.insertId });
    }
  );
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ error: "User not found" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, // include role in token
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role, // return user role to frontend
    });
  });
});

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const d = path.join(__dirname, "../uploads/profile_pics");
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
      cb(null, d);
    },
    filename: (req, file, cb) => cb(null, `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`)
  }),
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// Update profile fields
router.put("/profile", authenticateToken, (req, res) => {
  const { name, email, contact } = req.body;
  db.query("UPDATE users SET name = ?, email = ?, contact = ? WHERE id = ?", [name, email, contact, req.user.id], (err) => {
    if (err) return res.status(500).json({ message: "Update failed" });
    res.json({ message: "Profile updated" });
  });
});

// Upload profile picture
router.post("/profile/pic", authenticateToken, upload.single("avatar"), (req, res) => {
  const filename = req.file.filename;
  db.query("UPDATE users SET profile_pic = ? WHERE id = ?", [filename, req.user.id], (err) => {
    if (err) return res.status(500).json({ message: "Failed to update profile pic" });
    res.json({ message: "Profile picture updated", filename });
  });
});

router.put("/change-password", authenticateToken, (req,res) => {
  const { currentPassword, newPassword } = req.body;
  db.query("SELECT password FROM users WHERE id = ?", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "DB error" });
    const user = rows[0];
    if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(400).json({ message: "Current password incorrect" });
    const hashed = bcrypt.hashSync(newPassword, 10);
    db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, req.user.id], (err2) => {
      if (err2) return res.status(500).json({ message: "Update failed" });
      res.json({ message: "Password changed" });
    });
  });
});

router.get("/download/:photoId", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const photoId = req.params.photoId;
  const [rows] = await dbPromise.query("SELECT * FROM photos WHERE id = ?", [photoId]);
  const photo = rows[0];
  if (!photo) return res.status(404).json({ message: "Not found" });
  if (photo.status !== "purchased" || photo.user_id !== userId || new Date(photo.expires_at) < new Date()) {
    return res.status(403).json({ message: "Access denied or expired" });
  }
  res.sendFile(path.resolve(__dirname, "../uploads", photo.filename));
});

// routes/payments.js
router.post("/webhook/paymongo", express.json(), async (req, res) => {
  // Validate webhook signature if PayMongo provides one; otherwise validate event content.
  const event = req.body;
  // Example: if event.type === 'payment.paid' { mark purchase or booking as paid }
  // TODO: verify signature per PayMongo docs
  console.log("PayMongo webhook received", event.type);
  // Respond 200 quickly
  res.sendStatus(200);
});

