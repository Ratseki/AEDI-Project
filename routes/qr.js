const express = require("express");
const router = express.Router();
const { dbPromise } = require("../config/db");
const crypto = require("crypto");
const QRCode = require("qrcode");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// ===============================
// ✅ Generate QR Code (Staff + Admin)
// ===============================
router.post("/generate", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ message: "Missing user_id" });

    // generate a 12-character hex code
    const code = crypto.randomBytes(6).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // expires in 7 days

    // save QR code to DB
    await dbPromise.query(
      "INSERT INTO qr_codes (code, user_id, created_at, expires_at, generated_by) VALUES (?, ?, NOW(), ?, ?)",
      [code, user_id, expiresAt, req.user.id]
    );

    // generate QR image (base64)
    const galleryUrl = `http://localhost:3000/gallery.html?code=${code}`;
    const qrDataURL = await QRCode.toDataURL(galleryUrl);

    // send response
    res.json({
      success: true,
      message: "QR code generated successfully",
      code,
      gallery_link: galleryUrl,
      qr_image: qrDataURL,
      expires_at: expiresAt
    });

  } catch (err) {
    console.error("Error generating QR:", err);
    res.status(500).json({ message: "Error generating QR code" });
  }
});

// ===============================
// ✅ Verify QR Code (Client Side)
// ===============================
router.get("/verify", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ message: "Missing code" });

    const [rows] = await dbPromise.query(
      "SELECT user_id FROM qr_codes WHERE code = ? AND expires_at > NOW()",
      [code]
    );

    if (!rows.length) return res.json({ error: "Invalid or expired QR code" });

    res.json({ user_id: rows[0].user_id });
  } catch (err) {
    console.error("Error verifying QR:", err);
    res.status(500).json({ message: "Error verifying QR code" });
  }
});

// ===============================
// ✅ Get All Customers (for Staff Dropdown)
// ===============================
router.get("/customers", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  try {
    const [customers] = await dbPromise.query(
      "SELECT id, name, email FROM users WHERE role = 'customer' ORDER BY name ASC"
    );
    res.json(customers);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ message: "Error fetching customer list." });
  }
});

module.exports = router;
