const express = require("express");
const router = express.Router();
const { dbPromise } = require("../config/db");
const QRCode = require("qrcode");
const authenticateToken = require("../middleware/authMiddleware");

// Generate QR / Access code (staff/admin)
router.post("/generate", async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ message: "Missing user_id" });

    const code = "PRF-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const qrUrl = `http://localhost:3000/gallery.html?code=${code}`;

    await dbPromise.query(
      "INSERT INTO gallery_access_codes (user_id, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))",
      [user_id, code]
    );

    const qrImage = await QRCode.toDataURL(qrUrl);

    res.json({ success: true, user_id, code, qrUrl, qrImage, message: "Access code generated successfully" });
  } catch (err) {
    console.error("QR Generate Error:", err);
    res.status(500).json({ message: "Server error generating access code" });
  }
});

// Validate QR / access code (customer)
router.get("/access/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const [rows] = await dbPromise.query(
      "SELECT user_id, expires_at FROM gallery_access_codes WHERE code = ?",
      [code]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: "Invalid access code" });

    const access = rows[0];
    if (new Date(access.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: "Access code expired" });
    }

    res.json({ success: true, user_id: access.user_id });
  } catch (err) {
    console.error("Access validation error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get logged-in user's gallery (production-ready)
router.get("/gallery", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all published photos for this user
    const [photos] = await dbPromise.query(
      `SELECT id, file_path, file_name, price, status, purchased_at, expires_at
       FROM photos
       WHERE user_id = ? AND is_published = 1
       ORDER BY created_at DESC`,
      [userId]
    );

    // Map file paths to accessible URLs
    const formattedPhotos = photos.map(photo => ({
      ...photo,
      file_path: `/uploads/${photo.file_path.split('/').pop()}` // only filename
    }));

    // Remaining downloads
    const [downloads] = await dbPromise.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN status='purchased' AND expires_at > NOW() THEN 1 ELSE 0 END),0) AS remaining,
         COUNT(*) AS total
       FROM photo_purchases
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      photos: formattedPhotos,
      remaining: downloads[0]?.remaining || 0,
      total: downloads[0]?.total || 0
    });
  } catch (err) {
    console.error("Gallery fetch error:", err);
    res.status(500).json({ message: "Server error fetching gallery" });
  }
});

module.exports = router;
