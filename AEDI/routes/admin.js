const express = require("express");
const router = express.Router();
const mysql = require("mysql2");

// Setup your database connection (you can import it from server.js later if you modularize)
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "multimedia_booking"
});

// ======================= REPORTS & ANALYTICS =======================

// 1. Get total bookings
router.get("/bookings-count", (req, res) => {
  db.query("SELECT COUNT(*) AS total_bookings FROM bookings", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results[0]);
  });
});

// 2. Get total revenue
router.get("/revenue", (req, res) => {
  db.query("SELECT SUM(amount) AS total_revenue FROM payments WHERE status = 'paid'", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results[0]);
  });
});

// 3. Get most popular services (by number of bookings)
router.get("/popular-services", (req, res) => {
  const query = `
    SELECT s.name, COUNT(b.id) AS bookings_count
    FROM services s
    LEFT JOIN bookings b ON s.id = b.service_id
    GROUP BY s.id
    ORDER BY bookings_count DESC
    LIMIT 5;
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

module.exports = router;
