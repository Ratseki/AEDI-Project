const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const { dbPromise } = require("../config/db");
const fetch = require("node-fetch");

const router = express.Router();

const mode = process.env.PAYMONGO_MODE || "test";
const PAYMONGO_SECRET_KEY =
  mode === "live"
    ? process.env.PAYMONGO_LIVE_SECRET_KEY
    : process.env.PAYMONGO_TEST_SECRET_KEY;

// ============================
// 1️⃣ Single photo purchase (PayMongo checkout)
// ============================
router.post("/buy", authenticateToken, async (req, res) => {
  try {
    const { photo_id, method } = req.body;
    const user_id = req.user.id;

    // Fetch photo info
    const [photoRows] = await dbPromise.query("SELECT * FROM photos WHERE id=?", [photo_id]);
    if (!photoRows.length) return res.status(404).json({ message: "Photo not found." });
    const photo = photoRows[0];
    const price = photo.price;

    // PayMongo request body
    const bodyData = {
      data: {
        attributes: {
          line_items: [
            {
              name: `Photo #${photo_id}`,
              amount: price * 100, // PayMongo expects amount in centavos
              currency: "PHP",
              quantity: 1,
            },
          ],
          payment_method_types: ["gcash", "card"],
          success_url: "http://localhost:3000/user/gallery?status=success",
          cancel_url: "http://localhost:3000/user/gallery?status=cancelled",
          description: `Photo #${photo_id}`,
          metadata: {
            user_id: user_id,
            photo_id: photo_id,
          },
        },
      },
    };

    // Send to PayMongo
    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(PAYMONGO_SECRET_KEY + ":").toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("PayMongo error:", data);
      return res.status(400).json({ message: "PayMongo error", data });
    }

    // Save pending purchase in DB
    await dbPromise.query(
      "INSERT INTO photo_purchases (photo_id, user_id, price, status) VALUES (?, ?, ?, 'pending')",
      [photo_id, user_id, price]
    );

    res.json({ checkout_url: data.data.attributes.checkout_url });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    res.status(500).json({ message: "Error creating checkout session." });
  }
});

// ============================
// 2️⃣ Webhook endpoint
// ============================
router.post("/webhook", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    const payload = JSON.parse(req.body.toString());
    const eventType = payload.data.type;
    const attrs = payload.data.attributes;

    if (eventType === "checkout_session.payment.paid") {
      const description = attrs.description || "";
      const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Single photo purchase
      const photoMatch = description.match(/Photo #(\d+)/);
      if (photoMatch) {
        const photo_id = parseInt(photoMatch[1]);
        const [[purchase]] = await dbPromise.query(
          "SELECT user_id, price FROM photo_purchases WHERE photo_id=? AND status='pending' ORDER BY id DESC LIMIT 1",
          [photo_id]
        );

        if (purchase) {
          // Update photo_purchases
          await dbPromise.query(
            "UPDATE photo_purchases SET status='active', expires_at=?, purchase_date=NOW() WHERE photo_id=? AND status='pending'",
            [expires_at, photo_id]
          );

          // Update photos table
          await dbPromise.query(
            "UPDATE photos SET status='purchased', purchased_at=NOW(), expires_at=? WHERE id=?",
            [expires_at, photo_id]
          );

          // Insert transaction
          await dbPromise.query(
            `INSERT INTO transactions 
             (user_id, reference_id, type, related_id, amount, payment_method, status, created_at)
             VALUES (?, ?, 'photo', ?, ?, ?, 'confirmed', NOW())`,
            [purchase.user_id, payload.data.id, photo_id, purchase.price, attrs.payment_method_used || 'unknown']
          );

          console.log(`✅ Photo #${photo_id} purchased by user ${purchase.user_id}`);
        }
      }

      // Bulk purchase
      const bulkMatch = description.match(/Bulk purchase for user #(\d+)/);
      if (bulkMatch) {
        const user_id = parseInt(bulkMatch[1]);
        const [purchases] = await dbPromise.query(
          "SELECT photo_id, price FROM photo_purchases WHERE user_id=? AND status='pending'",
          [user_id]
        );

        if (purchases.length > 0) {
          const photo_ids = purchases.map(p => p.photo_id);

          // Update photo_purchases & photos
          await dbPromise.query(
            "UPDATE photo_purchases SET status='active', expires_at=?, purchase_date=NOW() WHERE user_id=? AND status='pending'",
            [expires_at, user_id]
          );

          await dbPromise.query(
            "UPDATE photos SET status='purchased', purchased_at=NOW(), expires_at=? WHERE id IN (?)",
            [expires_at, photo_ids]
          );

          // Insert transactions
          for (const p of purchases) {
            await dbPromise.query(
              `INSERT INTO transactions 
               (user_id, reference_id, type, related_id, amount, payment_method, status, created_at)
               VALUES (?, ?, 'photo', ?, ?, ?, 'confirmed', NOW())`,
              [user_id, payload.data.id, p.photo_id, p.price, attrs.payment_method_used || 'unknown']
            );
          }

          console.log(`✅ Bulk purchase completed for user ${user_id}`);
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(400).send("Webhook error");
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
// 5️⃣ Bulk gallery purchase (manual / create pending + PayMongo)
// ============================
router.post("/purchase-bulk", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { photo_ids, method } = req.body;

    if (!Array.isArray(photo_ids) || photo_ids.length === 0)
      return res.status(400).json({ message: "No photos selected." });

    const lineItems = [];
    const pendingInserts = [];

    for (const id of photo_ids) {
      const [photoRows] = await dbPromise.query("SELECT price FROM photos WHERE id=?", [id]);
      if (!photoRows.length) continue;

      lineItems.push({
        name: `Photo #${id}`,
        amount: Math.round(photoRows[0].price * 100),
        currency: "PHP",
        quantity: 1,
      });

      pendingInserts.push([id, user_id, photoRows[0].price, 'pending']); // status pending
    }

    if (lineItems.length === 0) return res.status(400).json({ message: "No valid photos selected." });

    // Insert pending purchases
    await dbPromise.query(
      "INSERT INTO photo_purchases (photo_id, user_id, price, status) VALUES ?",
      [pendingInserts]
    );

    // Create PayMongo checkout session
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
            success_url: "http://localhost:3000/gallery.html?status=success",
            cancel_url: "http://localhost:3000/gallery.html?status=cancelled",
          },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(400).json({ message: "PayMongo error", data });

    res.json({ checkout_url: data.data.attributes.checkout_url });
  } catch (err) {
    console.error("Bulk purchase error:", err);
    res.status(500).json({ message: "Error purchasing photos." });
  }
});

module.exports = router;
