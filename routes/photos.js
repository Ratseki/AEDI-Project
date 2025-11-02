// ========================================
// 📸 Photo Routes (Staff + Customer)
// ========================================
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { dbPromise } = require("../config/db");
const cron = require("node-cron");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// ========================================
// ⚙️ Multer Setup
// ========================================
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

// ========================================
// 🧍 Staff/Admin: Upload (Single or Multiple)
// ========================================
router.post(
  "/upload",
  authenticateToken,
  authorizeRoles("staff", "admin"),
  upload.array("photos"),
  async (req, res) => {
    try {
      const { user_id } = req.body;
      if (!user_id || req.files.length === 0) {
        return res.status(400).json({ message: "Missing user_id or no files uploaded." });
      }

      const uploadedBy = req.user.id;

      const values = req.files.map((file) => [
        user_id,                // user_id (customer)
        uploadedBy,             // uploaded_by (staff/admin)
        file.originalname,      // file_name
        `/uploads/${file.filename}`, // file_path
        "available",            // status
        100.0,                  // price
        1,                      // is_published
        new Date(),             // created_at
      ]);

      await dbPromise.query(
        `INSERT INTO photos (
          user_id,
          uploaded_by,
          file_name,
          file_path,
          status,
          price,
          is_published,
          created_at
        ) VALUES ?`,
        [values]
      );

      res.json({ success: true, message: `${req.files.length} photo(s) uploaded successfully!` });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: "Error uploading photos." });
    }
  }
);

// ========================================
// 💳 Purchase Photo (Individual)
// ========================================
router.post("/purchase/:photoId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { photoId } = req.params;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

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

// ========================================
// 📦 Bulk Purchase Photos
// ========================================
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

// ========================================
// ⬇️ Download Purchased Photo
// ========================================
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

// ========================================
// 🕒 Cron: Auto-Expire Purchased Photos
// ========================================
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

// ========================================
// ❌ Delete Photo (Staff/Admin only)
// ========================================
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

// ❌ Bulk Delete Photos (Staff/Admin only)
router.post(
  "/delete-bulk",
  authenticateToken,
  authorizeRoles("staff", "admin"),
  async (req, res) => {
    try {
      const { photo_ids } = req.body;
      if (!Array.isArray(photo_ids) || photo_ids.length === 0) {
        return res.status(400).json({ message: "No photos selected for deletion." });
      }

      const placeholders = photo_ids.map(() => "?").join(",");

      // Delete from database
      const [result] = await dbPromise.query(
        `DELETE FROM photos WHERE id IN (${placeholders})`,
        photo_ids
      );

      res.json({
        success: true,
        message: `Deleted ${result.affectedRows} photo(s) successfully.`,
      });
    } catch (err) {
      console.error("Bulk delete error:", err);
      res.status(500).json({ message: "Error deleting photos." });
    }
  }
);


// ========================================
// 👥 Staff/Admin: Get All Customers
// ========================================
router.get(
  "/customers",
  authenticateToken,
  authorizeRoles("staff", "admin"),
  async (req, res) => {
    try {
      const [customers] = await dbPromise.query(
        "SELECT id, name, email, created_at FROM users WHERE role = 'customer' ORDER BY created_at DESC"
      );
      res.json(customers);
    } catch (err) {
      console.error("Error fetching customers:", err);
      res.status(500).json({ message: "Error fetching customers." });
    }
  }
);

// 👁️ Staff/Admin: View any user's gallery
router.get(
  "/gallery/customer/:userId",
  authenticateToken,
  authorizeRoles("staff", "admin"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const [photos] = await dbPromise.query(
        `SELECT id, file_name, file_path, price, status, purchased_at, expires_at
         FROM photos
         WHERE user_id = ? AND is_published = 1
         ORDER BY created_at DESC`,
        [userId]
      );

      const formattedPhotos = photos.map((p) => ({
        ...p,
        file_path: `/uploads/${p.file_path.split("/").pop()}`,
      }));

      res.json(formattedPhotos);
    } catch (err) {
      console.error("Staff gallery fetch error:", err);
      res.status(500).json({ message: "Error fetching gallery." });
    }
  }
);



module.exports = router;
