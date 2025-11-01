// routes/galleryAccess.js
const express = require("express");
const router = express.Router();
const { dbPromise } = require("../config/db");
const QRCode = require("qrcode"); // npm install qrcode

// Generate QR / Access code for a user (staff/admin side)
router.post("/generate", async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ message: "Missing user_id" });

    const code = "PRF-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const qrUrl = `http://localhost:3000/gallery.html?code=${code}`;

    // Store in DB
    await dbPromise.query(
      "INSERT INTO gallery_access_codes (user_id, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))",
      [user_id, code]
    );

    // Generate QR image (base64)
    const qrImage = await QRCode.toDataURL(qrUrl);

    res.json({
      success: true,
      user_id,
      code,
      qrUrl,
      qrImage,
      message: "Access code generated successfully"
    });
  } catch (err) {
    console.error("QR Generate Error:", err);
    res.status(500).json({ message: "Server error generating access code" });
  }
});

// Validate code (customer side)
router.get("/access/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const [rows] = await dbPromise.query(
      "SELECT user_id, expires_at FROM gallery_access_codes WHERE code = ?",
      [code]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Invalid access code" });
    }

    const access = rows[0];
    const expired = new Date(access.expires_at) < new Date();

    if (expired) {
      return res.status(400).json({ success: false, message: "Access code expired" });
    }

    res.json({ success: true, user_id: access.user_id });
  } catch (err) {
    console.error("Access validation error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
