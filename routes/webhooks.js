// routes/webhooks.js
const express = require("express");
const router = express.Router();
const { dbPromise } = require("../config/db");

// ✅ FIX: Use type: "*/*" to force capture of ANY body (prevents undefined error)
router.post("/paymongo", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    let payload;
    
    // 1. Parse the body
    if (Buffer.isBuffer(req.body)) {
      payload = JSON.parse(req.body.toString("utf8"));
    } else {
      payload = req.body;
    }

    // ✅ FIX: Safety check to stop crashes if payload is missing
    if (!payload || !payload.data) {
      console.error("❌ Webhook Error: Payload is undefined or missing data.");
      return res.status(400).send("Invalid payload");
    }

    console.log("🔔 Main Webhook Hit!");
    
    // 2. Get Event Type
    // The structure is: payload.data.attributes.type
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
        console.log(`✅ Webhook: Single Photo #${photo_id} (Session: ${checkout_session_id}) purchased.`);
      }
    }

    // ===================================
    // CASE 2: BULK PHOTO PURCHASE
    // ===================================
    const bulkMatch = description.match(/Bulk purchase for user #(\d+)/);
    if (bulkMatch) {
      const user_id = sessionAttributes.metadata?.user_id; 
      
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
        console.log(`✅ Webhook: Bulk purchase of ${photo_ids.length} photos completed.`);
      }
    }

    // ===================================
    // CASE 3: BOOKING PAYMENT
    // ===================================
    const bookingMatch = description.match(/Payment for booking #(\d+)/);
    if (bookingMatch) {
      const booking_id = parseInt(bookingMatch[1]);
      const amount = sessionAttributes.line_items[0].amount / 100;
      
      const [[booking]] = await dbPromise.query(
        `SELECT b.user_id, s.price FROM bookings b
         LEFT JOIN services s ON b.service_id = s.id
         WHERE b.id = ?`, 
         [booking_id]
      );

      if (booking) {
        await dbPromise.query(
          `INSERT INTO transactions (user_id, reference_id, type, related_id, amount, payment_method, status, created_at)
           VALUES (?, ?, 'booking', ?, ?, ?, 'confirmed', NOW())`,
          [booking.user_id, ref_id, booking_id, amount, paymentMethod]
        );

        const [[paymentStats]] = await dbPromise.query(
          `SELECT SUM(amount) AS total_paid FROM transactions 
           WHERE related_id = ? AND type = 'booking' AND status = 'confirmed'`,
          [booking_id]
        );
        
        const total_paid = Number(paymentStats.total_paid || 0);
        const total_price = Number(booking.price || 0);

        let new_status = 'partial';
        if (total_paid >= total_price) new_status = 'paid';

        await dbPromise.query("UPDATE bookings SET status = ? WHERE id = ?", [new_status, booking_id]);
        console.log(`✅ Webhook: Booking #${booking_id} updated to '${new_status}'`);
      }
    }

    res.status(200).send("Webhook processed successfully");

  } catch (error) {
    console.error("❌ Webhook processing failed:", error);
    res.status(500).send("Webhook processing error");
  }
});

module.exports = router;