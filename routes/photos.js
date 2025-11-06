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

const sharp = require("sharp");

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
      const { customer_id, booking_id, price } = req.body;

      if (!customer_id) {
        return res.status(400).json({ message: "Please provide a customer ID." });
      }
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "Please upload at least one file." });
      }

      const uploadedBy = req.user.id;

      const values = req.files.map((file) => [
        customer_id,                      // user_id
        uploadedBy,                       // uploaded_by
        booking_id && booking_id !== "null" ? booking_id : null, // booking_id or null
        file.originalname,                // file_name
        `/uploads/${file.filename}`,      // file_path
        "available",                      // status
        price || 100.0,                   // price
        1,                                // is_published
        new Date(),                       // created_at
      ]);

      await dbPromise.query(
        `INSERT INTO photos (
          user_id,
          uploaded_by,
          booking_id,
          file_name,
          file_path,
          status,
          price,
          is_published,
          created_at
        ) VALUES ?`,
        [values]
      );

      res.json({
        success: true,
        message: `${req.files.length} photo(s) uploaded successfully!`,
        files: values.map(v => ({
          file_name: v[3],
          file_path: v[4],
        })),
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: "Error uploading photos." });
    }
  }
);

// 💳 Photo purchase route (updated)
router.post("/purchase", authenticateToken, async (req, res) => {
  try {
    const { user_id, photo_ids, total_amount } = req.body;
    if (!user_id || !photo_ids?.length || !total_amount)
      return res.status(400).json({ message: "Invalid purchase data" });

    const db = await dbPromise;

    // Create unique transaction reference
    const reference = "PHOTO-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Record the transaction
    await db.query(
      "INSERT INTO transactions (user_id, type, reference, total_amount, status) VALUES (?, 'photo_purchase', ?, ?, 'completed')",
      [user_id, reference, total_amount]
    );

    // Insert purchased photos with 10 downloads each
    for (const photoId of photo_ids) {
      await db.query(
        "INSERT INTO photo_purchases (user_id, photo_id, downloads_remaining, transaction_reference) VALUES (?, ?, 10, ?)",
        [user_id, photoId, reference]
      );
    }

    res.json({ message: "✅ Photos purchased successfully", reference });
  } catch (err) {
    console.error("❌ Purchase error:", err);
    res.status(500).json({ message: "Error recording purchase" });
  }
});

// 💳 Photo purchase route (updated)
router.post("/purchase", authenticateToken, async (req, res) => {
  try {
    const { user_id, photo_ids, total_amount } = req.body;
    if (!user_id || !photo_ids?.length || !total_amount)
      return res.status(400).json({ message: "Invalid purchase data" });

    const db = await dbPromise;

    // Create unique transaction reference
    const reference = "PHOTO-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Record the transaction
    await db.query(
      "INSERT INTO transactions (user_id, type, reference, total_amount, status) VALUES (?, 'photo_purchase', ?, ?, 'completed')",
      [user_id, reference, total_amount]
    );

    // Insert purchased photos with 10 downloads each
    for (const photoId of photo_ids) {
      await db.query(
        "INSERT INTO photo_purchases (user_id, photo_id, downloads_remaining, transaction_reference) VALUES (?, ?, 10, ?)",
        [user_id, photoId, reference]
      );
    }

    res.json({ message: "✅ Photos purchased successfully", reference });
  } catch (err) {
    console.error("❌ Purchase error:", err);
    res.status(500).json({ message: "Error recording purchase" });
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

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    for (const photoId of photo_ids) {
      const [photo] = await dbPromise.query("SELECT * FROM photos WHERE id = ?", [photoId]);
      if (!photo.length) continue;

      // Skip if already purchased
      const [existing] = await dbPromise.query(
        "SELECT * FROM photo_purchases WHERE photo_id = ? AND user_id = ?",
        [photoId, userId]
      );
      if (existing.length) continue;

      await dbPromise.query(
      `INSERT INTO photo_purchases 
      (photo_id, user_id, price, expires_at, downloads_remaining, status)
      VALUES (?, ?, ?, ?, ?, 'active')`,
      [photoId, userId, photo[0].price, expiresAt, MAX_DOWNLOADS]
    );


      await dbPromise.query(
      `UPDATE photos 
      SET status = 'purchased', purchased_at = NOW(), expires_at = NULL
      WHERE id = ? AND user_id = ?`,
      [photoId, userId]
    );

    }

    res.json({ success: true, message: `Purchased ${photo_ids.length} photos.`, expires_at: expiresAt });
  } catch (err) {
    console.error("Bulk purchase error:", err);
    res.status(500).json({ message: "Error purchasing photos." });
  }
});


// place near top of file (after other requires)
const MAX_DOWNLOADS = 10; // global per-purchase allocation

// ⬇️ Download Purchased Photo (clean file) — decrements downloads_remaining
router.get("/download/:photoId", authenticateToken, async (req, res) => {
  try {
    const { photoId } = req.params;
    const userId = req.user.id;

    const [rows] = await dbPromise.query(
      `SELECT p.id, p.file_path, pp.downloads_remaining, pp.id AS purchase_id
       FROM photos p
       JOIN photo_purchases pp ON p.id = pp.photo_id
       WHERE p.id = ? AND pp.user_id = ? AND pp.status='active' AND (pp.expires_at IS NULL OR pp.expires_at > NOW())
       LIMIT 1`,
      [photoId, userId]
    );

    if (!rows.length) return res.status(403).json({ message: "Photo not available, expired, or not purchased." });

    const photo = rows[0];

    if ((photo.downloads_remaining || 0) <= 0) {
      return res.status(403).json({ message: "No remaining downloads left!" });
    }

    const filePath = path.join(__dirname, "..", photo.file_path);

    // Decrement first to avoid race condition where user requests repeatedly.
    await dbPromise.query(
      "UPDATE photo_purchases SET downloads_remaining = downloads_remaining - 1 WHERE id = ? AND downloads_remaining > 0",
      [photo.purchase_id]
    );

    // Send the original (clean) file to the user
    return res.download(filePath, `photo_${photo.id}${path.extname(photo.file_path)}`, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        // NOTE: we already decremented, you could re-increment on error if desired.
      }
    });
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: "Error downloading photo." });
  }
});

// 👤 Get remaining & total downloads for logged-in user
router.get("/downloads", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // get active (non-expired) purchases for user
    const [purchases] = await dbPromise.query(
      `SELECT downloads_remaining, expires_at
       FROM photo_purchases
       WHERE user_id = ? AND status = 'active'`,
      [userId]
    );

    const now = new Date();

    const validPurchases = purchases.filter(
      p => !p.expires_at || new Date(p.expires_at) > now
    );

    const remaining = validPurchases.reduce((sum, p) => sum + (p.downloads_remaining || 0), 0);
    const total = validPurchases.length * MAX_DOWNLOADS;

    res.json({ remaining, total });
  } catch (err) {
    console.error("Error fetching download info:", err);
    res.status(500).json({ remaining: 0, total: 0 });
  }
});

// ========================================
// 🕒 Cron: Auto-Expire Purchased Photos
// ========================================
cron.schedule("0 * * * *", async () => {
  try {
    // Expire only those with a defined expiry date
    await dbPromise.query(`
      UPDATE photos 
      SET status = 'expired' 
      WHERE status = 'purchased' 
        AND expires_at IS NOT NULL 
        AND expires_at < NOW()
    `);

    await dbPromise.query(`
      UPDATE photo_purchases 
      SET status = 'expired' 
      WHERE status = 'active' 
        AND expires_at IS NOT NULL 
        AND expires_at < NOW()
    `);

    console.log("🕓 Expired photos cleaned up");
  } catch (err) {
    console.error("Error cleaning expired photos:", err);
  }
});


// 🧹 Auto-cleanup previews older than 1 hour
cron.schedule("*/30 * * * *", () => {
  const previewDir = path.join(__dirname, "../uploads/previews");
  if (!fs.existsSync(previewDir)) return;

  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  fs.readdir(previewDir, (err, files) => {
    if (err) return;
    files.forEach((file) => {
      const filePath = path.join(previewDir, file);
      fs.stat(filePath, (err, stats) => {
        if (!err && stats.mtimeMs < oneHourAgo) fs.unlink(filePath, () => {});
      });
    });
  });
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

// 👤 Customer: View own gallery (with watermark previews)
router.get("/gallery/user", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [photos] = await dbPromise.query(
      `SELECT id, file_name, file_path, price, status, purchased_at, expires_at
       FROM photos
       WHERE user_id = ? AND is_published = 1 AND status IN ('available', 'purchased')
       ORDER BY created_at DESC`,
      [userId]
    );

    // 🖋️ Watermark Configuration
    const WATERMARK_TEXT = "PROFILEPICMULTIMEDIA";

    // generate watermarked preview paths
    const previews = await Promise.all(
      photos.map(async (p) => {
        const inputPath = path.join(__dirname, "..", p.file_path);
        const previewDir = path.join(__dirname, "../uploads/previews");
        if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

        const outputPath = path.join(previewDir, `preview_${p.id}.jpg`);

        // only regenerate if missing
        if (!fs.existsSync(outputPath)) {
          try {
            await sharp(inputPath)
              .resize(800)
              .composite([
                {
                  input: Buffer.from(`
                    <svg width="800" height="200">
                      <text x="50%" y="50%" font-size="48" fill="rgba(255,255,255,0.3)" text-anchor="middle" dy=".3em" font-family="Arial" font-weight="bold">
                        ${WATERMARK_TEXT}
                      </text>
                    </svg>`),
                  gravity: "center",
                },
              ])
              .jpeg({ quality: 90 })
              .toFile(outputPath);
          } catch (err) {
            console.error("Watermark error for photo", p.id, err.message);
          }
        }

        return {
          ...p,
          file_path: `/uploads/previews/preview_${p.id}.jpg`,
        };
      })
    );

    res.json(previews);
  } catch (err) {
    console.error("Customer gallery fetch error:", err);
    res.status(500).json({ message: "Error fetching user gallery." });
  }
});


// ========================================
// 🌐 Public Gallery (No Auth Required)
// ========================================
router.get("/public", async (req, res) => {
  try {
    const [photos] = await dbPromise.query(
      `SELECT id, file_name, file_path, price, created_at 
       FROM photos 
       WHERE is_published = 1 
       ORDER BY created_at DESC`
    );

    const formattedPhotos = photos.map((p) => ({
      ...p,
      file_path: `/uploads/${p.file_path.split("/").pop()}`,
    }));

    res.json({ success: true, photos: formattedPhotos });
  } catch (err) {
    console.error("Public gallery fetch error:", err);
    res.status(500).json({ success: false, message: "Error fetching public gallery." });
  }
});


module.exports = router;
