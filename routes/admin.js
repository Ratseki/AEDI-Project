// routes/admin.js
const express = require("express");
const router = express.Router();
const { db, dbPromise } = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// ================================
// ✅ Get All Users
// ================================
router.get("/users", authenticateToken, authorizeRoles("admin", "staff"), async (req, res) => {
  try {
    const db = await dbPromise;
    const [rows] = await db.query("SELECT id, name, email, role FROM users");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// ✅ Get All Bookings (PERMANENT FIX V2)
// ================================
// This route now JOINS reviews correctly using booking_id.
router.get("/bookings", authenticateToken, authorizeRoles("admin", "staff"), async (req, res) => {
  try {
    const db = await dbPromise;
    
    // This query JOINS all tables, including reviews
    const [rows] = await db.query(`
      SELECT
        b.id,
        b.date,
        b.status,
        b.location,
        u.name AS client_name,
        s.name AS package,
        s.price AS payment,
        r.rating,             -- ✅ FIX: Re-added rating
        r.comment AS review_text -- ✅ FIX: Re-added comment (as review_text)
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN reviews r ON b.id = r.booking_id  -- ✅ FIX: This JOIN now works
      ORDER BY b.date DESC
      LIMIT 100
    `);

    // ✅ FIX: Map the flat SQL result to the nested object dashboard.js expects
    const bookings = rows.map(b => ({
      ...b,
      // Create the nested review object
      review: b.rating ? { rating: b.rating, text: b.review_text } : null,
      payment: Number(b.payment || 0)
    }));
    
    res.json(bookings);

  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json([]); // Send empty array on error
  }
});

// ================================
// ✅ Get All Services
// ================================
router.get("/services", authenticateToken, authorizeRoles("admin", "staff"), async (req, res) => {
  try {
    const db = await dbPromise;
    const [rows] = await db.query("SELECT * FROM services");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// ✅ Basic Analytics (FIXED)
// ================================
// This route now calculates revenue, popular packages, and client counts.
router.get("/stats", authenticateToken, authorizeRoles("admin", "staff"), async (req, res) => {
  try {
    const db = await dbPromise;

    // Query 1: Get user and booking counts
    const [[counts]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'customer') AS total_users,
        (SELECT COUNT(*) FROM bookings) AS total_bookings
    `);

    // Query 2: Get total confirmed revenue from all transactions
    const [[revenue]] = await db.query(
      "SELECT SUM(amount) AS total_revenue FROM transactions WHERE status = 'confirmed'"
    );

    // Query 3: Get the most popular package (from services table, joined on bookings)
    const [[popular]] = await db.query(`
      SELECT s.name AS popular_package
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      GROUP BY s.name
      ORDER BY COUNT(b.service_id) DESC
      LIMIT 1
    `);

    // Combine all results and send
    res.json({
      total_users: counts.total_users || 0,
      total_bookings: counts.total_bookings || 0,
      total_revenue: revenue.total_revenue || 0,
      popular_package: popular ? popular.popular_package : '-' // Handle no bookings
    });

  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ total_users: 0, total_bookings: 0, total_revenue: 0, popular_package: '-' });
  }
});

// ================================
// ✅ Transactions Routes (Redundant but OK)
// ================================
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