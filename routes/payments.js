// routes/payments.js
const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

// Determine which PayMongo key to use
const MODE = process.env.PAYMONGO_MODE || "test";
const SECRET_KEY = MODE === "live"
  ? process.env.PAYMONGO_LIVE_SECRET_KEY
  : process.env.PAYMONGO_TEST_SECRET_KEY;

// ===========================================
// Create PayMongo Checkout Session
// ===========================================
router.post("/create-checkout-session", authenticateToken, async (req, res) => {
    console.log("✅ Received payment request:", req.body);
  try {
    const { amount, booking_id, method } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount." });
    if (!booking_id) return res.status(400).json({ message: "Missing booking ID." });
    if (!method) return res.status(400).json({ message: "Missing payment method." });

    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(SECRET_KEY + ":").toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: true,
            description: `Payment for booking #${booking_id}`,
            payment_method_types: [method],
            line_items: [
              {
                name: `Booking #${booking_id}`,
                amount: amount * 100, // in centavos
                currency: "PHP",
                quantity: 1
              }
            ],
            success_url: "http://localhost:3000/payments.html?status=success",
            cancel_url: "http://localhost:3000/payments.html?status=cancelled"
          }
        }
      })
    });

    const data = await response.json();

    if (data.errors) {
      console.error("❌ PayMongo API error:", data.errors);
      return res.status(400).json({ message: data.errors[0].detail });
    }

    res.json({ checkout_url: data.data.attributes.checkout_url });
  } catch (err) {
    console.error("❌ Payment route error:", err);
    res.status(500).json({ message: "Server error creating checkout session." });
  }
});

// routes/payments.js (add this)
router.post("/webhook", express.json({ type: "application/json" }), async (req, res) => {
  try {
    const event = req.body;
    console.log("📦 Webhook event received:", event.type);

    if (event.data && event.data.attributes) {
      const { type, data } = event;
      // Example: handle successful payments
      if (type === "checkout.session.paid") {
        const bookingId = data.attributes.metadata.booking_id;
        console.log(`✅ Booking ${bookingId} payment confirmed!`);
        // You can update your DB booking status here
      }
    }

    res.status(200).send("Webhook received");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(400).send("Webhook handling error");
  }
});


module.exports = router;
