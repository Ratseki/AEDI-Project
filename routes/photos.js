// routes/photos.js
// Full photo routes: upload, gallery, purchase, download, framed copies, previews, delete, bulk delete, customer list, admin/user purchase history.

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { db, dbPromise } = require("../config/db");
const cron = require("node-cron");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const sharp = require("sharp");

// --------------------
// Constants & Directories
// --------------------
const UPLOAD_DIR = path.join(__dirname, "../uploads");
const PREVIEW_DIR = path.join(UPLOAD_DIR, "previews");
const FRAMES_DIR = path.join(UPLOAD_DIR, "frames");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(PREVIEW_DIR)) fs.mkdirSync(PREVIEW_DIR, { recursive: true });
if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });

const MAX_DOWNLOADS_DEFAULT = parseInt(process.env.MAX_DOWNLOADS || "10", 10);

// --------------------
// Multer storage
// --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// --------------------
// Helper: ensure downloads_remaining column exists
// --------------------
async function ensureDownloadsColumn() {
  try {
    const [rows] = await dbPromise.query("SHOW COLUMNS FROM photo_purchases LIKE 'downloads_remaining'");
    if (!rows.length) {
      console.log("Adding downloads_remaining column to photo_purchases...");
      await dbPromise.query(`ALTER TABLE photo_purchases ADD COLUMN downloads_remaining INT NOT NULL DEFAULT ${MAX_DOWNLOADS_DEFAULT}`);
      console.log("✅ Added downloads_remaining column.");
    }
  } catch (err) {
    console.error("Error ensuring downloads_remaining column:", err);
  }
}
ensureDownloadsColumn().catch(() => {});

// --------------------
// Upload photos (staff/admin)
// --------------------
router.post(
  "/upload",
  authenticateToken,
  authorizeRoles("staff", "admin"),
  upload.array("photos"),
  async (req, res) => {
    try {
      const { customer_id, booking_id, price } = req.body;
      if (!customer_id) return res.status(400).json({ message: "Please provide a customer ID." });
      if (!req.files || req.files.length === 0) return res.status(400).json({ message: "Please upload at least one file." });

      const uploadedBy = req.user.id;
      const values = req.files.map((file) => [
        customer_id,
        uploadedBy,
        booking_id && booking_id !== "null" ? booking_id : null,
        file.originalname,
        `/uploads/${file.filename}`,
        "available",
        price || 100.0,
        1,
        new Date(),
      ]);

      await dbPromise.query(
        `INSERT INTO photos
         (user_id, uploaded_by, booking_id, file_name, file_path, status, price, is_published, created_at)
         VALUES ?`,
        [values]
      );

      return res.json({
        success: true,
        message: `${req.files.length} photo(s) uploaded successfully!`,
        files: values.map(v => ({ file_name: v[3], file_path: v[4] }))
      });
    } catch (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ message: "Error uploading photos." });
    }
  }
);

// --------------------
// Purchase multiple photos
// --------------------
router.post("/purchase", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { photo_ids, package_downloads } = req.body;

    if (!Array.isArray(photo_ids) || photo_ids.length === 0)
      return res.status(400).json({ message: "No photos selected for purchase." });

    const downloadsAllowed = parseInt(package_downloads || MAX_DOWNLOADS_DEFAULT, 10);

    let totalAmount = 0;
    await ensureDownloadsColumn();

    const ref = `PHOTO-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    for (const pid of photo_ids) {
      const [[photoRow]] = await dbPromise.query("SELECT price FROM photos WHERE id = ?", [pid]);
      if (!photoRow) continue;

      totalAmount += photoRow.price;

      // Insert purchase record with downloads_remaining = package_downloads
      await dbPromise.query(
        `INSERT INTO photo_purchases 
          (photo_id, user_id, price, purchase_date, expires_at, downloads_remaining, status, created_at)
         VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), ?, 'active', NOW())`,
        [pid, user_id, photoRow.price, downloadsAllowed]
      );

      // Update photo status
      await dbPromise.query(
        "UPDATE photos SET status='purchased', purchased_at=NOW(), expires_at=DATE_ADD(NOW(), INTERVAL 7 DAY) WHERE id=?",
        [pid]
      );
    }

    // Transaction record for the whole purchase
    await dbPromise.query(
      "INSERT INTO transactions (user_id, reference_id, type, related_id, amount, payment_method, status, created_at) VALUES (?, ?, 'photo', NULL, ?, ?, 'confirmed', NOW())",
      [user_id, ref, totalAmount, 'manual']
    );

    return res.json({ message: "✅ Purchase recorded", reference: ref, total_amount: totalAmount });
  } catch (err) {
    console.error("Purchase error:", err);
    return res.status(500).json({ message: "Error recording purchase" });
  }
});


// --------------------
// Download purchased photo (both framed + unframed)
// --------------------
router.get("/download/:photoId", authenticateToken, async (req, res) => {
  const photoId = req.params.photoId;
  const userId = req.user.id;

  const conn = await dbPromise.getConnection();
  try {
    await conn.beginTransaction();

    // Get active purchase
    const [ppRows] = await conn.query(
      `SELECT pp.id AS purchase_id, pp.downloads_remaining, pp.expires_at, p.file_path, p.id AS photo_id
       FROM photo_purchases pp
       JOIN photos p ON pp.photo_id = p.id
       WHERE pp.photo_id = ? AND pp.user_id = ? AND pp.status = 'active'
       ORDER BY pp.purchase_date DESC
       LIMIT 1`,
      [photoId, userId]
    );

    if (!ppRows.length) {
      await conn.rollback(); conn.release();
      return res.status(403).json({ message: "Photo not available, expired, or not purchased." });
    }

    const pp = ppRows[0];

    // Check expiration
    if (pp.expires_at && new Date(pp.expires_at) <= new Date()) {
      await conn.query("UPDATE photo_purchases SET status='expired' WHERE id = ?", [pp.purchase_id]);
      await conn.commit(); conn.release();
      return res.status(403).json({ message: "Purchase expired." });
    }

    // Decrement downloads_remaining
    if (pp.downloads_remaining <= 0) {
      await conn.rollback(); conn.release();
      return res.status(403).json({ message: "No remaining downloads." });
    }

    await conn.query(
      "UPDATE photo_purchases SET downloads_remaining = downloads_remaining - 1 WHERE id = ? AND downloads_remaining > 0",
      [pp.purchase_id]
    );

    // Record download transaction
    const dlRef = `DL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    await conn.query(
      `INSERT INTO transactions (user_id, reference_id, type, related_id, amount, payment_method, status, created_at)
       VALUES (?, ?, 'photo', ?, 0.00, 'download', 'confirmed', NOW())`,
      [userId, dlRef, photoId]
    );

    await conn.commit();
    conn.release();

    const originalPath = path.join(__dirname, "..", pp.file_path);
    if (!fs.existsSync(originalPath)) return res.status(500).json({ message: "File not found on server." });

    // Generate framed copy
    const framedFilename = `framed_${pp.photo_id}${path.extname(pp.file_path)}`;
    const framedPath = path.join(FRAMES_DIR, framedFilename);

    if (!fs.existsSync(framedPath)) {
      const image = sharp(originalPath);
      const meta = await image.metadata();
      const frameAssetPath = path.join(__dirname, "../assets/frame.png");
      if (fs.existsSync(frameAssetPath)) {
        await image.resize({ width: meta.width }).composite([{ input: frameAssetPath, gravity: "center" }]).toFile(framedPath);
      } else {
        const border = 40;
        await image.extend({ top: border, bottom: border, left: border, right: border, background: { r: 255, g: 255, b: 255, alpha: 1 } }).jpeg({ quality: 90 }).toFile(framedPath);
      }
    }

    // Send both files sequentially as a zip (simpler UX)
    const archiver = require("archiver");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=photo_${pp.photo_id}.zip`);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);
    archive.file(originalPath, { name: `photo_${pp.photo_id}${path.extname(pp.file_path)}` });
    archive.file(framedPath, { name: framedFilename });
    archive.finalize();

  } catch (err) {
    console.error(err);
    try { conn.release(); } catch {}
    return res.status(500).json({ message: "Error downloading photo." });
  }
});

// --------------------
// My purchased photos (detailed, with remaining downloads)
// --------------------
router.get("/my-photos", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    const [rows] = await dbPromise.query(
      `SELECT p.id AS photo_id, p.file_name, p.file_path, pp.downloads_remaining, pp.expires_at, pp.purchase_date
       FROM photo_purchases pp
       JOIN photos p ON pp.photo_id = p.id
       WHERE pp.user_id = ? 
       ORDER BY pp.purchase_date DESC`,
      [user_id]
    );

    // Map and include download status
    const now = new Date();
    const formatted = rows.map(r => ({
      photo_id: r.photo_id,
      file_name: r.file_name,
      preview_path: `/uploads/previews/preview_${r.photo_id}.jpg`,
      downloads_remaining: r.downloads_remaining,
      expires_at: r.expires_at,
      expired: r.expires_at && new Date(r.expires_at) <= now,
      purchased_at: r.purchase_date
    }));

    return res.json(formatted);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching purchased photos." });
  }
});

// --------------------
// User gallery (watermarked previews, including download status)
// --------------------
router.get("/gallery/user", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [photos] = await dbPromise.query(
      `SELECT p.id, p.file_name, p.file_path, p.price, p.status,
              pp.downloads_remaining, pp.expires_at
       FROM photos p
       LEFT JOIN photo_purchases pp ON pp.photo_id = p.id AND pp.user_id = ?
       WHERE p.is_published = 1 AND p.status IN ('available','purchased')
       ORDER BY p.created_at DESC`,
      [userId]
    );

    const WATERMARK_TEXT = "PROFILEPICMULTIMEDIA";
    const now = new Date();

    const previews = await Promise.all(photos.map(async (p) => {
      const inputPath = path.join(__dirname, "..", p.file_path);
      const outputPath = path.join(PREVIEW_DIR, `preview_${p.id}.jpg`);

      if (!fs.existsSync(outputPath)) {
        try {
          await sharp(inputPath)
            .resize(800)
            .composite([{
              input: Buffer.from(`<svg width="800" height="200">
                <text x="50%" y="50%" font-size="48" fill="rgba(255,255,255,0.3)" text-anchor="middle" dy=".3em" font-family="Arial" font-weight="bold">${WATERMARK_TEXT}</text>
              </svg>`),
              gravity: "center"
            }])
            .jpeg({ quality: 90 })
            .toFile(outputPath);
        } catch (err) { console.error("Watermark error", p.id, err.message); }
      }

      return {
        photo_id: p.id,
        file_name: p.file_name,
        preview_path: `/uploads/previews/preview_${p.id}.jpg`,
        price: p.price,
        status: p.status,
        downloads_remaining: p.downloads_remaining || 0,
        expired: p.expires_at && new Date(p.expires_at) <= now,
        purchased_at: p.expires_at ? p.expires_at : null
      };
    }));

    return res.json(previews);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching user gallery." });
  }
});

// --------------------
// Public gallery
// --------------------
router.get("/public", async (req, res) => {
  try {
    const [photos] = await dbPromise.query(`SELECT id, file_name, file_path, price, created_at FROM photos WHERE is_published = 1 ORDER BY created_at DESC`);
    const formatted = photos.map(p => ({ ...p, file_path: `/uploads/${p.file_path.split("/").pop()}` }));
    return res.json({ success: true, photos: formatted });
  } catch (err) { console.error(err); return res.status(500).json({ success: false, message: "Error fetching public gallery." }); }
});

// --------------------
// Download info (remaining / total downloads)
// --------------------
router.get("/downloads", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [purchases] = await dbPromise.query(`SELECT downloads_remaining, expires_at FROM photo_purchases WHERE user_id = ? AND status = 'active'`, [userId]);

    const now = new Date();
    const validPurchases = purchases.filter(p => !p.expires_at || new Date(p.expires_at) > now);

    const remaining = validPurchases.reduce((sum, p) => sum + (p.downloads_remaining || 0), 0);
    const total = validPurchases.length * MAX_DOWNLOADS_DEFAULT;

    return res.json({ remaining, total });
  } catch (err) { console.error(err); return res.status(500).json({ remaining: 0, total: 0 }); }
});

// --------------------
// Admin: purchase history
// --------------------
router.get("/admin/purchase-history", authenticateToken, authorizeRoles("admin", "staff"), async (req, res) => {
  try {
    const [rows] = await dbPromise.query(`SELECT pp.*, p.file_name, p.file_path, u.name AS user_name FROM photo_purchases pp JOIN photos p ON pp.photo_id = p.id JOIN users u ON pp.user_id = u.id ORDER BY pp.purchase_date DESC`);
    return res.json(rows);
  } catch (err) { console.error(err); return res.status(500).json({ message: "Error fetching purchase history." }); }
});

// --------------------
// User: purchase history
// --------------------
router.get("/purchase-history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await dbPromise.query(`SELECT pp.*, p.file_name, p.file_path FROM photo_purchases pp JOIN photos p ON pp.photo_id = p.id WHERE pp.user_id = ? ORDER BY pp.purchase_date DESC`, [userId]);
    return res.json(rows);
  } catch (err) { console.error(err); return res.status(500).json({ message: "Error fetching purchase history." }); }
});

// --------------------
// Load Customers for dropdown
// --------------------
router.get("/customers", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  try {
    const [rows] = await dbPromise.query("SELECT id, name FROM users WHERE role = 'customer' ORDER BY name ASC");
    return res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error loading customers." });
  }
});

// Delete single photo
router.delete("/:id", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  try {
    const photoId = req.params.id;
    const [[photo]] = await dbPromise.query("SELECT file_path FROM photos WHERE id = ?", [photoId]);

    if (photo && fs.existsSync(path.join(__dirname, "..", photo.file_path))) {
      fs.unlinkSync(path.join(__dirname, "..", photo.file_path));
    }

    await dbPromise.query("DELETE FROM photos WHERE id = ?", [photoId]);
    return res.json({ message: "Photo deleted successfully." });
  } catch (err) { console.error(err); return res.status(500).json({ message: "Error deleting photo." }); }
});


// Bulk delete photos
router.post("/delete-bulk", authenticateToken, authorizeRoles("staff", "admin"), async (req, res) => {
  try {
    const { photo_ids } = req.body;
    if (!Array.isArray(photo_ids) || !photo_ids.length) return res.status(400).json({ message: "No photo IDs provided." });

    const [photos] = await dbPromise.query(`SELECT file_path FROM photos WHERE id IN (?)`, [photo_ids]);
    photos.forEach(p => {
      const filePath = path.join(__dirname, "..", p.file_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await dbPromise.query(`DELETE FROM photos WHERE id IN (?)`, [photo_ids]);
    return res.json({ message: `${photo_ids.length} photo(s) deleted successfully.` });
  } catch (err) { console.error(err); return res.status(500).json({ message: "Error deleting photos." }); }
});
module.exports = router;
