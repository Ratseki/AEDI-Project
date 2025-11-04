const express = require("express");
const router = express.Router();
const { dbPromise } = require("../config/db");

router.post("/paymongo", express.json({ type: "application/json" }), async (req, res) => {
  try {
    const event = req.body.data?.attributes;
    if (!event) return res.sendStatus(200);

    // ✅ Check if payment was completed
    if (event.status === "paid" && event.description) {
      const match = event.description.match(/Photo ID: (\d+)/);
      const photoId = match ? match[1] : null;

      // 🔹 Extract payment details
      const referenceId = event.reference_number || "N/A";
      const amount = event.amount / 100; // PayMongo sends in cents
      const paymentMethod = event.payment_method_used || "Unknown";
      const status = event.status;
      const userId = event.metadata?.user_id || null; // if you sent user_id via metadata

      // ✅ Update photo status
      if (photoId) {
        await dbPromise.query(
          "UPDATE photos SET status='purchased', purchased_at=NOW() WHERE id=?",
          [photoId]
        );
      }

      // ✅ Insert transaction record
      await dbPromise.query(
        `INSERT INTO transactions 
        (user_id, reference_id, type, related_id, amount, payment_method, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [userId, referenceId, "photo_purchase", photoId, amount, paymentMethod, status]
      );

      console.log("✅ Transaction recorded successfully!");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.sendStatus(500);
  }
});

module.exports = router;
