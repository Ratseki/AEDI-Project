// routes/webhooks.js
const express = require("express");
const router = express.Router();
const { dbPromise } = require("../config/db");

// This is the FINAL, WORKING webhook
// We add the express.raw() middleware *here*
router.post("/paymongo", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    let payload;
    if (Buffer.isBuffer(req.body)) {
      payload = JSON.parse(req.body.toString("utf8"));
    } else {
      payload = req.body;
    }

    console.log("🔔 Main Webhook Hit!");
    const eventType = payload.data.attributes.type;

    if (eventType !== "checkout_session.payment.paid") {
      console.log(`Event ${eventType} not handled.`);
      return res.status(200).send("Event not handled");
    }

    // --- Payment is successful, now process it ---
    const sessionData = payload.data.attributes.data;
    const sessionAttributes = sessionData.attributes;
    const checkout_session_id = sessionData.id; 
    const description = sessionAttributes.description || "";
    const paymentMethod = sessionAttributes.payment_method_used || "unknown";
    const ref_id = sessionAttributes.payments?.[0]?.id || payload.data.id;
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); 

    console.log(`Processing paid session: ${checkout_session_id}`);

    // ===================================
    // CASE 1: SINGLE PHOTO PURCHASE
    // ===================================
    const photoMatch = description.match(/Photo #(\d+)/);
    if (photoMatch) {
      const photo_id = parseInt(photoMatch[1]);
      const user_id = sessionAttributes.metadata?.user_id;
      const amount = sessionAttributes.line_items[0].amount / 100;
      
      const [[purchase]] = await dbPromise.query(
        "SELECT * FROM photo_purchases WHERE photo_id=? AND user_id=? AND status='pending' AND checkout_session_id=? ORDER BY id DESC LIMIT 1",
        [photo_id, user_id, checkout_session_id]
      );

      if (purchase) {
        await dbPromise.query(
          "UPDATE photo_purchases SET status='active', expires_at=?, purchase_date=NOW() WHERE id=?",
          [expires_at, purchase.id]
        );
        await dbPromise.query(
          "UPDATE photos SET status='purchased', purchased_at=NOW(), expires_at=? WHERE id=?",
          [expires_at, photo_id]
        );
        await dbPromise.query(
          `INSERT INTO transactions (user_id, reference_id, type, related_id, amount, payment_method, status, created_at)
           VALUES (?, ?, 'photo', ?, ?, ?, 'confirmed', NOW())`,
          [user_id, ref_id, photo_id, amount, paymentMethod]
        );
        console.log(`✅ Webhook: Single Photo #${photo_id} (Session: ${checkout_session_id}) purchased by user ${user_id}`);
      } else {
        console.log(`⚠️ Webhook: No matching *pending* purchase found for single photo ${photo_id} with session ${checkout_session_id}`);
      }
    }

    // ===================================
    // CASE 2: BULK PHOTO PURCHASE
    // ===================================
    const bulkMatch = description.match(/Bulk purchase for user #(\d+)/);
    if (bulkMatch) {
      const user_id = sessionAttributes.metadata?.user_id; 
      if (!user_id) {
         console.log(`⚠️ Webhook: Bulk purchase has no user_id in metadata.`);
         return res.status(400).send("Missing user_id in metadata");
      }
      
      const total_amount = sessionAttributes.line_items.reduce((sum, item) => sum + item.amount, 0) / 100;
      
      const [pendingPurchases] = await dbPromise.query(
        "SELECT * FROM photo_purchases WHERE user_id=? AND status='pending' AND checkout_session_id=?",
        [user_id, checkout_session_id]
      );

      if (pendingPurchases.length > 0) {
        const photo_ids = pendingPurchases.map(p => p.photo_id);
        
        await dbPromise.query(
          "UPDATE photo_purchases SET status='active', expires_at=?, purchase_date=NOW() WHERE user_id=? AND status='pending' AND checkout_session_id=?",
          [expires_at, user_id, checkout_session_id]
        );
        await dbPromise.query(
          "UPDATE photos SET status='purchased', purchased_at=NOW(), expires_at=? WHERE id IN (?)",
          [expires_at, photo_ids]
        );
        await dbPromise.query(
          `INSERT INTO transactions (user_id, reference_id, type, related_id, amount, payment_method, status, created_at)
           VALUES (?, ?, 'photo-bulk', NULL, ?, ?, 'confirmed', NOW())`,
          [user_id, ref_id, total_amount, paymentMethod]
        );
        console.log(`✅ Webhook: Bulk purchase (Session: ${checkout_session_id}) of ${photo_ids.length} photos completed for user ${user_id}`);
      } else {
        console.log(`⚠️ Webhook: No matching *pending* purchases found for bulk session ${checkout_session_id}`);
      }
    }

    // ... (rest of the cases) ...

    res.status(200).send("Webhook processed successfully");

  } catch (error) {
    console.error("❌ Webhook processing failed:", error);
    res.status(500).send("Webhook processing error");
  }
});

module.exports = router;