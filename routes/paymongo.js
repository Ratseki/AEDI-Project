// routes/paymongo.js
const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

router.post("/create-checkout", async (req, res) => {
  try {
    const { amount, booking_id, method } = req.body;

    if (!amount || amount <= 0)
      return res.status(400).json({ message: "Invalid amount." });

    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(process.env.PAYMONGO_SECRET_KEY).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: false,
            show_description: true,
            description: `Payment for booking #${booking_id}`,
            payment_method_types: [method],
            line_items: [
              {
                name: `Booking #${booking_id}`,
                amount: amount * 100, // centavos
                currency: "PHP",
                quantity: 1
              }
            ],
            success_url: "http://localhost:5500/success.html",
            cancel_url: "http://localhost:5500/bookings.html"
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
    console.error("❌ PayMongo route error:", err);
    res.status(500).json({ message: "Server error creating checkout session." });
  }
});

module.exports = router;
