const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { dbPromise } = require("../config/db");
const cron = require("node-cron");

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// === Upload Photo ===
router.post("/upload", upload.single("photo"), async (req, res) => {
  try {
    const { user_id } = req.body;
    const filePath = `/uploads/${req.file.filename}`;

    await dbPromise.query(
      "INSERT INTO photos (user_id, file_path, status, price, is_published, created_at) VALUES (?, ?, 'available', 100.00, 1, NOW())",
      [user_id, filePath]
    );

    res.json({ success: true, message: "Photo uploaded successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error uploading photo." });
  }
});

// === Get User Gallery ===
router.get("/gallery/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [photos] = await dbPromise.query(
      "SELECT id, file_path, price, status, expires_at, purchased_at FROM photos WHERE user_id = ? AND is_published = 1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(photos);
  } catch (err) {
    console.error("Error fetching user gallery:", err);
    res.status(500).json({ message: "Error fetching user gallery." });
  }
});

// === Purchase Single Photo ===
router.post("/purchase/:photoId", async (req, res) => {
  try {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [result] = await dbPromise.query(
      "UPDATE photos SET status='purchased', purchased_at=NOW(), expires_at=? WHERE id=? AND status='available'",
      [expiresAt, req.params.photoId]
    );

    if (result.affectedRows === 0)
      return res.status(400).json({ message: "Photo not available for purchase." });

    res.json({ success: true, message: "Photo purchased successfully!", expires_at: expiresAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error purchasing photo." });
  }
});

// === Bulk Purchase Photos ===
router.post("/purchase-bulk", async (req, res) => {
  try {
    const { user_id, photo_ids } = req.body;
    if (!Array.isArray(photo_ids) || photo_ids.length === 0) {
      return res.status(400).json({ message: "No photos selected." });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const placeholders = photo_ids.map(() => "?").join(",");
    const [result] = await dbPromise.query(
      `UPDATE photos 
       SET status='purchased', purchased_at=NOW(), expires_at=? 
       WHERE id IN (${placeholders}) AND status='available' AND is_published = 1`,
      [expiresAt, ...photo_ids]
    );

    if (result.affectedRows === 0)
      return res.status(400).json({ message: "Selected photos not available." });

    res.json({ success: true, message: "Photos purchased successfully!", expires_at: expiresAt });
  } catch (err) {
    console.error("Bulk purchase error:", err);
    res.status(500).json({ message: "Error purchasing photos." });
  }
});

// === Download Photo ===
router.get("/download/:photoId", async (req, res) => {
  try {
    const [rows] = await dbPromise.query("SELECT * FROM photos WHERE id = ?", [req.params.photoId]);
    const photo = rows[0];
    if (!photo) return res.status(404).json({ message: "Photo not found." });

    const now = new Date();
    if (photo.status !== "purchased" || (photo.expires_at && new Date(photo.expires_at) < now)) {
      return res.status(403).json({ message: "Photo access expired or not purchased." });
    }

    res.download(path.join(__dirname, "..", photo.file_path));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error downloading photo." });
  }
});

// === Cron Job: Expire purchased photos ===
cron.schedule("0 * * * *", async () => {
  try {
    await dbPromise.query("UPDATE photos SET status='expired' WHERE status='purchased' AND expires_at < NOW()");
    console.log("🕓 Expired photos cleaned up");
  } catch (err) {
    console.error("Error cleaning expired photos:", err);
  }
});

module.exports = router;
