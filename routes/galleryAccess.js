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

// Get logged-in user's gallery (shows available + purchased)
router.get("/gallery", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [photos] = await dbPromise.query(
      `SELECT 
         p.id,
         p.file_name,
         p.file_path,
         p.price,
         p.status,
         p.purchased_at,
         COALESCE(pp.status, 'unpaid') AS purchase_status
       FROM photos p
       LEFT JOIN photo_purchases pp 
         ON p.id = pp.photo_id AND pp.user_id = ?
       WHERE p.is_published = 1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    const formattedPhotos = photos.map(photo => ({
      ...photo,
      file_path: `/uploads/${photo.file_path.split('/').pop()}`
    }));

    res.json(formattedPhotos);
  } catch (err) {
    console.error("Gallery fetch error:", err);
    res.status(500).json({ message: "Server error fetching gallery" });
  }
});

module.exports = router;
