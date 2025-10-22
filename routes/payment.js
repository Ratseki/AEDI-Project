// routes/payments.js
const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

router.post("/create-checkout-session", async (req, res) => {
  const { amount, booking_id } = req.body;

  try {
    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(PAYMONGO_SECRET + ":").toString("base64"),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            cancel_url: "http://localhost:3000/payments.html?status=cancelled",
            success_url: "http://localhost:3000/payments.html?status=success",
            line_items: [
              {
                name: "ProfilePicMultimedia Booking",
                quantity: 1,
                amount: amount * 100, // PayMongo expects amount in centavos
                currency: "PHP",
              },
            ],
            metadata: { booking_id },
          },
        },
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ PayMongo error:", err);
    res.status(500).json({ message: "Payment creation failed." });
  }
});

module.exports = router;
