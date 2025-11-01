const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const { dbPromise } = require("../config/db");
const fetch = require("node-fetch");

const router = express.Router();

// ============================
// 1️⃣ PayMongo checkout purchase
// ============================
router.post("/buy", authenticateToken, async (req, res) => {
  try {
    const { photo_id, price, method } = req.body;
    const user_id = req.user.id;

    const [photoRows] = await dbPromise.query("SELECT * FROM photos WHERE id = ?", [photo_id]);
    if (photoRows.length === 0) return res.status(404).json({ message: "Photo not found." });

    // Create PayMongo checkout session
    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: true,
            description: `Purchase for Photo #${photo_id}`,
            payment_method_types: [method],
            line_items: [
              {
                name: `Photo #${photo_id}`,
                amount: price * 100,
                currency: "PHP",
                quantity: 1
              }
            ],
            success_url: "http://localhost:3000/gallery.html?status=success",
            cancel_url: "http://localhost:3000/gallery.html?status=cancelled"
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(400).json({ message: "PayMongo error", data });

    res.json({ checkout_url: data.data.attributes.checkout_url });
  } catch (err) {
    console.error("❌ Photo purchase error:", err);
    res.status(500).json({ message: "Error creating photo purchase." });
  }
});

// ============================
// 2️⃣ Confirm PayMongo purchase
// ============================
router.post("/confirm", async (req, res) => {
  try {
    const { photo_id, user_id, price } = req.body;
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await dbPromise.query(
  `UPDATE photos SET status='purchased', purchased_at=NOW(), expires_at=? WHERE id=?`,
  [expires_at, photo_id]
  );

    res.json({ message: "Photo purchase recorded successfully!" });
  } catch (err) {
    console.error("❌ Confirm purchase error:", err);
    res.status(500).json({ message: "Error confirming purchase." });
  }
});

// ============================
// 3️⃣ User's purchased photos
// ============================
router.get("/my-photos", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const [rows] = await dbPromise.query(`
      SELECT p.*, pp.status, pp.expires_at 
      FROM photo_purchases pp
      JOIN photos p ON pp.photo_id = p.id
      WHERE pp.user_id = ? AND pp.status != 'expired'
    `, [user_id]);

    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch purchased photos error:", err);
    res.status(500).json({ message: "Error fetching purchased photos." });
  }
});

// ============================
// 4️⃣ Single gallery purchase (for user_gallery.js)
// ============================
router.post("/purchase/:photoId", async (req, res) => {
  try {
    const { user_id } = req.body; // sent from frontend
    const photoId = req.params.photoId;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [result] = await dbPromise.query(
      "UPDATE photos SET status='purchased', purchased_at=NOW(), expires_at=? WHERE id=? AND status='available'",
      [expiresAt, photoId]
    );

    if (result.affectedRows === 0)
      return res.status(400).json({ message: "Photo not available for purchase." });

    res.json({ success: true, message: "Photo purchased successfully!", expires_at: expiresAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error purchasing photo." });
  }
});

// ============================
// 5️⃣ Bulk gallery purchase
// ============================
router.post("/purchase-bulk", async (req, res) => {
  try {
    const { user_id, photo_ids } = req.body;

    console.log("Photo IDs to purchase:", photo_ids);
    
    if (!Array.isArray(photo_ids) || photo_ids.length === 0)
      return res.status(400).json({ message: "No photos selected." });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const placeholders = photo_ids.map(() => "?").join(",");
    const [result] = await dbPromise.query(
      `UPDATE photos SET status='purchased', purchased_at=NOW(), expires_at=? WHERE id IN (${placeholders}) AND status='available'`,
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

module.exports = router;
