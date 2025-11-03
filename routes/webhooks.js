const express = require("express");
const router = express.Router();
const { dbPromise } = require("../config/db");

router.post("/paymongo", express.json({ type: "application/json" }), async (req, res) => {
  try {
    const event = req.body.data?.attributes;
    if (!event) return res.sendStatus(200);

    // When payment is completed
    if (event.status === "paid" && event.description) {
      const match = event.description.match(/Photo ID: (\d+)/);
      if (match) {
        const photoId = match[1];
        await dbPromise.query("UPDATE photos SET status='purchased', purchased_at=NOW() WHERE id=?", [photoId]);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

module.exports = router;
