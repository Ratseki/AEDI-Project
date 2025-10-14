// routes/payments.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Record a new downpayment
router.post("/", (req, res) => {
  const { booking_id, amount } = req.body;

  db.query(
    "INSERT INTO payments (booking_id, amount, status) VALUES (?, ?, 'pending')",
    [booking_id, amount],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Downpayment recorded", payment_id: result.insertId });
    }
  );
});

// Update payment status (e.g., approved or rejected)
router.put("/:id", (req, res) => {
  const { status } = req.body;
  db.query(
    "UPDATE payments SET status = ? WHERE id = ?",
    [status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Payment status updated" });
    }
  );
});

module.exports = router;
