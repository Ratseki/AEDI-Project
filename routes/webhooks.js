const express = require("express");
const router = express.Router();
const { dbPromise } = require("../config/db");

// ✅ PayMongo Webhook Route (fixed)
router.post("/paymongo", express.raw({ type: "*/*" }), async (req, res) => {
  try {
    let payload;

    // Handle raw Buffer (PayMongo sends raw bytes)
    if (Buffer.isBuffer(req.body)) {
      const rawString = req.body.toString("utf8");
      try {
        payload = JSON.parse(rawString);
      } catch (err) {
        console.error("❌ Failed to parse JSON from raw body:", err);
        return res.status(400).send("Invalid JSON");
      }
    } else {
      payload = req.body;
    }

    console.log("🔔 Webhook route hit!");
    console.log("🧾 Parsed payload:", JSON.stringify(payload, null, 2));

    const eventType = payload?.data?.attributes?.type;
    console.log("📨 Event Type:", eventType);

    if (eventType === "checkout_session.payment.paid") {
      const session = payload.data.attributes.data.attributes;

      const description = session.description;
      const paymentMethod = session.payment_method_used;
      const amount = session.line_items[0].amount / 100;
      const metadata = session.metadata || {};

      const userId = metadata.user_id || null;
      const photoId =
        metadata.photo_id ||
        (description.match(/#(\d+)/) ? parseInt(description.match(/#(\d+)/)[1]) : null);

      if (!photoId) {
        console.warn("⚠️ Could not determine photo ID.");
        return res.status(400).send("Invalid webhook data");
      }

      // ✅ Update photo record
      const [photoResult] = await dbPromise.query("SELECT * FROM photos WHERE id = ?", [photoId]);
      if (photoResult.length > 0) {
        await dbPromise.query(
          "UPDATE photos SET status = 'purchased', purchased_at = NOW() WHERE id = ?",
          [photoId]
        );
        console.log(`✅ Photo ID ${photoId} marked as purchased.`);
      } else {
        console.log(`⚠️ No photo found with ID ${photoId}.`);
      }

      // ✅ Log transaction
      await dbPromise.query(
        `INSERT INTO transactions (user_id, reference_id, type, related_id, amount, payment_method, status, created_at)
         VALUES (?, ?, 'photo', ?, ?, ?, 'confirmed', NOW())`,
        [
          userId || 1,
          session.payments?.[0]?.id || "no_ref",
          photoId,
          amount,
          paymentMethod,
        ]
      );

      console.log(`💰 Transaction recorded for user ${userId || "N/A"} (photo ${photoId})`);
    }

    res.status(200).send("Webhook processed successfully");
  } catch (error) {
    console.error("❌ Webhook processing failed:", error);
    res.status(500).send("Webhook processing error");
  }
});

module.exports = router;
