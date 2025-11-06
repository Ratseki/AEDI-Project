const express = require("express");
const router = express.Router();
const { db, dbPromise } = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Get all users
router.get("/users", (req, res) => {
  db.query("SELECT id, name, email, role FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Get all bookings
router.get("/bookings", (req, res) => {
  db.query("SELECT * FROM bookings", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Get all services
router.get("/services", (req, res) => {
  db.query("SELECT * FROM services", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Basic analytics
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

// ✅ GET all transactions
router.get(
  "/transactions",
  authenticateToken,
  authorizeRoles("admin", "staff"),
  async (req, res) => {
    try {
      const [rows] = await dbPromise.query(`
        SELECT t.*, u.name AS user_name
        FROM transactions t
        JOIN users u ON u.id = t.user_id
        ORDER BY t.created_at DESC
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ PATCH transaction status (confirm/reject)
router.patch(
  "/transactions/:id",
  authenticateToken,
  authorizeRoles("admin", "staff"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // "confirmed" or "rejected"

      const [result] = await dbPromise.query(
        "UPDATE transactions SET status = ? WHERE id = ?",
        [status, id]
      );

      if (result.affectedRows === 0) return res.status(404).json({ error: "Transaction not found" });
      res.json({ message: `Transaction ${status}` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
