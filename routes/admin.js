const express = require("express");
const router = express.Router();
const mysql = require("mysql2");

// ✅ Connect to MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "multimedia_booking"
});

// ======================
// ADMIN FUNCTIONS
// ======================

// 1️⃣ Get all users
router.get("/users", (req, res) => {
  db.query("SELECT id, name, email, role FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// 2️⃣ Get all bookings
router.get("/bookings", (req, res) => {
  db.query("SELECT * FROM bookings", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// 3️⃣ Get all services
router.get("/services", (req, res) => {
  db.query("SELECT * FROM services", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// 4️⃣ Basic analytics — count bookings and users
router.get("/stats", (req, res) => {
  const stats = {};
  db.query("SELECT COUNT(*) AS total_users FROM users", (err, users) => {
    if (err) return res.status(500).json({ error: err });
    stats.total_users = users[0].total_users;

    db.query("SELECT COUNT(*) AS total_bookings FROM bookings", (err, bookings) => {
      if (err) return res.status(500).json({ error: err });
      stats.total_bookings = bookings[0].total_bookings;
      res.json(stats);
    });
  });
});

module.exports = router;
