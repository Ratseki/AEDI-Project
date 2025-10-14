// routes/analytics.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get package booking counts
router.get("/packages", (req, res) => {
  db.query(
    `SELECT p.name AS package_name, COUNT(b.id) AS total_bookings
     FROM bookings b
     JOIN packages p ON b.package_id = p.id
     GROUP BY b.package_id
     ORDER BY total_bookings DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    }
  );
});

// Get best month for bookings
router.get("/best-month", (req, res) => {
  db.query(
    `SELECT MONTHNAME(date) AS month, COUNT(id) AS total_bookings
     FROM bookings
     GROUP BY MONTH(date)
     ORDER BY total_bookings DESC
     LIMIT 1`,
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results[0] || { message: "No data available" });
    }
  );
});

module.exports = router;
