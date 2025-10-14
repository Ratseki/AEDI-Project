const express = require("express");
const router = express.Router();
const db = require("../models/User"); // or wherever your MySQL connection is

// === DOWNPAYMENT ===
router.post("/downpayment", (req, res) => {
  const { booking_id, amount } = req.body;

  db.query(
    "UPDATE bookings SET downpayment = ?, status = 'confirmed' WHERE id = ?",
    [amount, booking_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "✅ Downpayment recorded successfully" });
    }
  );
});

// === BOOKING CANCELLATION ===
router.put("/cancel/:id", (req, res) => {
  db.query(
    "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "🚫 Booking cancelled successfully" });
    }
  );
});

// === ANALYTICS (Top Packages + Best Month) ===
router.get("/analytics", (req, res) => {
  const analytics = {};

  // Top 5 most booked packages
  const packageQuery = `
    SELECT p.name, COUNT(b.id) AS total_bookings
    FROM bookings b
    JOIN packages p ON b.package_id = p.id
    GROUP BY p.name
    ORDER BY total_bookings DESC
    LIMIT 5
  `;

  db.query(packageQuery, (err, packageResults) => {
    if (err) return res.status(500).json({ error: err });
    analytics.topPackages = packageResults;

    // Best month (most bookings)
    const monthQuery = `
      SELECT MONTHNAME(booking_date) AS month, COUNT(id) AS total
      FROM bookings
      GROUP BY MONTH(booking_date)
      ORDER BY total DESC
      LIMIT 1
    `;
    db.query(monthQuery, (err, monthResults) => {
      if (err) return res.status(500).json({ error: err });
      analytics.bestMonth = monthResults[0] || {};
      res.json(analytics);
    });
  });
});

module.exports = router;
