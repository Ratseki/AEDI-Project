const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const { dbPromise } = require("../config/db");

const router = express.Router();

const mode = process.env.PAYMONGO_MODE || "test";
const PAYMONGO_SECRET_KEY =
  mode === "live"
    ? process.env.PAYMONGO_LIVE_SECRET_KEY
    : process.env.PAYMONGO_TEST_SECRET_KEY;

// ============================
// 1️⃣ Single photo purchase (SMART FIX)
// ============================
router.post("/buy", authenticateToken, async (req, res) => {
  try {
    // ✅ FIX: Dynamically import node-fetch
    const fetch = (await import('node-fetch')).default;

    const { photo_id, method } = req.body;
    const user_id = req.user.id;
    // ... (rest of the function is identical) ...
    const [photoRows] = await dbPromise.query("SELECT * FROM photos WHERE id=?", [photo_id]);
    if (!photoRows.length) return res.status(404).json({ message: "Photo not found." });
    const photo = photoRows[0];
    const price = photo.price;

    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(PAYMONGO_SECRET_KEY + ":").toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [
              { name: `Photo #${photo_id}`, amount: price * 100, currency: "PHP", quantity: 1 }
            ],
            payment_method_types: [method],
            success_url: "http://localhost:3000/user/gallery?status=success",
            cancel_url: "http://localhost:3000/user/gallery?status=cancelled",
            description: `Photo #${photo_id}`,
            metadata: { user_id: user_id, photo_id: photo_id }, 
          },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("PayMongo error:", data);
      return res.status(400).json({ message: "PayMongo error", data });
    }

    const checkout_session_id = data.data.id;

    await dbPromise.query(
      "INSERT INTO photo_purchases (photo_id, user_id, price, status, checkout_session_id, downloads_remaining) VALUES (?, ?, ?, 'pending', ?, ?)",
      [photo_id, user_id, price, checkout_session_id, 10]
    );

    res.json({ checkout_url: data.data.attributes.checkout_url });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    res.status(500).json({ message: "Error creating checkout session." });
  }
});

// ============================
// 3️⃣ Get user's purchased photos
// ============================
router.get("/my-photos", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const [rows] = await dbPromise.query(
      `SELECT p.*, pp.status, pp.expires_at 
       FROM photo_purchases pp 
       JOIN photos p ON pp.photo_id = p.id 
       WHERE pp.user_id=? AND pp.status='active'`,
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching purchased photos." });
  }
});

// ============================
// 4️⃣ Single gallery purchase (manual)
// ============================
router.post("/purchase/:photoId", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const photoId = req.params.photoId;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [result] = await dbPromise.query(
      "UPDATE photos SET status='purchased', purchased_at=NOW(), expires_at=? WHERE id=? AND status='available'",
      [expiresAt, photoId]
    );

    if (result.affectedRows === 0)
      return res.status(400).json({ message: "Photo not available for purchase." });

    // Insert into photo_purchases
    const [[photo]] = await dbPromise.query("SELECT price FROM photos WHERE id=?", [photoId]);
    await dbPromise.query(
      "INSERT INTO photo_purchases (photo_id, user_id, price, status, purchase_date, expires_at) VALUES (?, ?, ?, 'active', NOW(), ?)",
      [photoId, user_id, photo.price, expiresAt]
    );

    res.json({ success: true, message: "Photo purchased successfully!", expires_at: expiresAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error purchasing photo." });
  }
});

// ============================
// 5️⃣ Bulk gallery purchase (SMART FIX V2)
// ============================
router.post("/purchase-bulk", authenticateToken, async (req, res) => {
  try {
    // ✅ FIX: Dynamically import node-fetch
    const fetch = (await import('node-fetch')).default;

    const user_id = req.user.id;
    const { photo_ids, method, package_downloads } = req.body;
    // ... (rest of the function is identical) ...
    const downloadsAllowed = parseInt(package_downloads || 10, 10);

    if (!Array.isArray(photo_ids) || photo_ids.length === 0)
      return res.status(400).json({ message: "No photos selected." });

    const lineItems = [];
    const photoPrices = {}; 

    for (const id of photo_ids) {
      const [photoRows] = await dbPromise.query("SELECT price FROM photos WHERE id=?", [id]);
      if (!photoRows.length) continue; 

      const price = photoRows[0].price;
      photoPrices[id] = price; 

      lineItems.push({
        name: `Photo #${id}`,
        amount: Math.round(price * 100),
        currency: "PHP",
        quantity: 1,
      });
    }

    if (lineItems.length === 0) return res.status(400).json({ message: "No valid photos selected." });

    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(PAYMONGO_SECRET_KEY + ":").toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: true,
            description: `Bulk purchase for user #${user_id}`,
            payment_method_types: [method],
            line_items: lineItems,
            success_url: "http://localhost:3000/user/gallery?status=success",
            cancel_url: "http://localhost:3000/user/gallery?status=cancelled",
            metadata: { user_id: user_id } 
          },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(400).json({ message: "PayMongo error", data });

    const checkout_session_id = data.data.id;

    const pendingInserts = Object.keys(photoPrices).map(id => [
        id, 
        user_id, 
        photoPrices[id], 
        'pending', 
        downloadsAllowed, 
        checkout_session_id 
    ]);

    await dbPromise.query(
      "INSERT INTO photo_purchases (photo_id, user_id, price, status, downloads_remaining, checkout_session_id) VALUES ?",
      [pendingInserts]
    );

    res.json({ checkout_url: data.data.attributes.checkout_url });

  } catch (err) {
    console.error("Bulk purchase error:", err);
    res.status(5.00).json({ message: "Error purchasing photos." });
  }
});

module.exports = router;
