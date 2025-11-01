const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { dbPromise } = require("../config/db");
const cron = require("node-cron");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// ============================
// ⚙️ Multer Setup
// ============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// ============================
// 🧍 Staff: Upload Photo
// ============================
router.post("/upload", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    if (req.user.role !== "staff" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only staff/admin can upload photos." });
    }

    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ message: "Missing user_id" });

    const filePath = `/uploads/${req.file.filename}`;

    await dbPromise.query(
      `INSERT INTO photos (user_id, file_path, status, price, is_published, created_at)
       VALUES (?, ?, 'available', 100.00, 1, NOW())`,
      [user_id, filePath]
    );

    res.json({ success: true, message: "Photo uploaded successfully!" });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Error uploading photo." });
  }
});

// === Upload Multiple Photos (Staff only) ===
router.post("/upload-multiple", authenticateToken, authorizeRoles("staff", "admin"), upload.array("photos"), async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id || req.files.length === 0)
      return res.status(400).json({ message: "Missing user_id or no files uploaded." });

    const values = req.files.map((file) => [
      user_id,
      null, // booking_id is null
      `/uploads/${file.filename}`,
      "available",
      100.0,
      1,
      new Date(),
      req.user.id,
    ]);

    await dbPromise.query(
      "INSERT INTO photos (user_id, file_path, status, price, is_published, created_at, uploaded_by) VALUES ?",
      [values]
    );

    res.json({ success: true, message: `${req.files.length} photos uploaded successfully!` });
  } catch (err) {
    console.error("Bulk upload error:", err);
    res.status(500).json({ message: "Error uploading photos." });
  }
});


// ============================
// 👁️ Customer: Get User Gallery
// ============================
router.get("/gallery/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [photos] = await dbPromise.query(
      `SELECT id, file_path, price, status, expires_at, purchased_at
       FROM photos
       WHERE user_id = ? AND is_published = 1
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(photos);
  } catch (err) {
    console.error("Fetch gallery error:", err);
    res.status(500).json({ message: "Error fetching gallery." });
  }
});

// ============================
// 💳 Purchase Photo (Local)
// ============================
router.post("/purchase/:photoId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const photoId = req.params.photoId;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [photo] = await dbPromise.query("SELECT * FROM photos WHERE id = ?", [photoId]);
    if (!photo.length) return res.status(404).json({ message: "Photo not found." });

    if (photo[0].user_id !== userId)
      return res.status(403).json({ message: "You cannot purchase another user's photo." });

    await dbPromise.query(
      `UPDATE photos SET status='purchased', purchased_at=NOW(), expires_at=? WHERE id=?`,
      [expiresAt, photoId]
    );

    await dbPromise.query(
      `INSERT INTO photo_purchases (photo_id, user_id, price, expires_at)
       VALUES (?, ?, ?, ?)`,
      [photoId, userId, photo[0].price, expiresAt]
    );

    res.json({ success: true, message: "Photo purchased successfully!", expires_at: expiresAt });
  } catch (err) {
    console.error("Purchase error:", err);
    res.status(500).json({ message: "Error purchasing photo." });
  }
});

// ============================
// 📦 Bulk Purchase
// ============================
router.post("/purchase-bulk", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { photo_ids } = req.body;
    if (!Array.isArray(photo_ids) || photo_ids.length === 0)
      return res.status(400).json({ message: "No photos selected." });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const placeholders = photo_ids.map(() => "?").join(",");

    const [result] = await dbPromise.query(
      `UPDATE photos
       SET status='purchased', purchased_at=NOW(), expires_at=?
       WHERE id IN (${placeholders}) AND user_id = ? AND status='available'`,
      [expiresAt, ...photo_ids, userId]
    );

    res.json({ success: true, message: `Purchased ${result.affectedRows} photos.`, expires_at: expiresAt });
  } catch (err) {
    console.error("Bulk purchase error:", err);
    res.status(500).json({ message: "Error purchasing photos." });
  }
});

// ============================
// ⬇️ Download Purchased Photo
// ============================
router.get("/download/:photoId", authenticateToken, async (req, res) => {
  try {
    const { photoId } = req.params;
    const userId = req.user.id;

    const [rows] = await dbPromise.query(
      `SELECT * FROM photos WHERE id = ? AND user_id = ?`,
      [photoId, userId]
    );
    if (!rows.length) return res.status(404).json({ message: "Photo not found." });

    const photo = rows[0];
    if (photo.status !== "purchased" || (photo.expires_at && new Date(photo.expires_at) < new Date())) {
      return res.status(403).json({ message: "Access expired or not purchased." });
    }

    const filePath = path.join(__dirname, "..", photo.file_path);
    res.download(filePath);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: "Error downloading photo." });
  }
});

// ============================
// 🕒 Cron: Auto-Expire Purchased Photos
// ============================
cron.schedule("0 * * * *", async () => {
  try {
    await dbPromise.query(
      "UPDATE photos SET status='expired' WHERE status='purchased' AND expires_at < NOW()"
    );
    await dbPromise.query(
      "UPDATE photo_purchases SET status='expired' WHERE status='active' AND expires_at < NOW()"
    );
    console.log("🕓 Expired photos cleaned up");
  } catch (err) {
    console.error("Error cleaning expired photos:", err);
  }
});

// === Delete Photo (Staff/Admin only) ===
router.delete("/:photoId", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  try {
    const { photoId } = req.params;
    const [result] = await dbPromise.query("DELETE FROM photos WHERE id = ?", [photoId]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Photo not found or already deleted." });

    res.json({ success: true, message: "Photo deleted successfully." });
  } catch (err) {
    console.error("Error deleting photo:", err);
    res.status(500).json({ message: "Error deleting photo." });
  }
});


module.exports = router;
