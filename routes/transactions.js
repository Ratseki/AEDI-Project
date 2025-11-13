// routes/transactions.js
const express = require("express");
const router = express.Router();
const { dbPromise } = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// ================================
// 📦 Get All Transactions (Admin/Staff)
// ================================
router.get("/", authenticateToken, authorizeRoles("admin", "staff"), async (req, res) => {
  try {
    const db = await dbPromise;

    const [rows] = await db.query(`
      SELECT t.id, t.reference_id, t.type, t.amount, t.payment_method, t.status, t.created_at,
             t.related_id AS booking_id,
             u.id AS user_id, u.name AS customer
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 50
    `);

    // Ensure array is returned to prevent frontend errors
    res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error("❌ Error fetching transactions:", err);
    res.status(500).json([]);
  }
});

// ================================
// 🔄 Update Transaction Status
// ================================
router.patch("/:id/status", authenticateToken, authorizeRoles("admin", "staff"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // ✅ Extended allowed statuses
    const allowedStatuses = ["confirmed", "rejected", "partial", "paid", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const db = await dbPromise;

    const [result] = await db.query("UPDATE transactions SET status = ? WHERE id = ?", [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Transaction not found" });

    // 🔄 Auto-update booking if linked
    const [[txn]] = await db.query("SELECT related_id FROM transactions WHERE id = ?", [id]);
    if (txn && txn.related_id) {
      await db.query("UPDATE bookings SET status = ? WHERE id = ?", [status, txn.related_id]);
    }

    // ✅ Return updated transaction with customer info for frontend refresh
    const [[updatedTxn]] = await db.query(`
      SELECT t.id, t.reference_id, t.type, t.amount, t.payment_method, t.status, t.created_at,
             t.related_id AS booking_id,
             u.id AS user_id, u.name AS customer
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `, [id]);

    res.json({ message: `Transaction ${status} successfully.`, transaction: updatedTxn });
  } catch (err) {
    console.error("❌ Error updating transaction status:", err);
    res.status(500).json({ message: "Error updating transaction status" });
  }
});

// ================================
// ✅ Optional: Fetch single transaction (helpful for frontend refresh)
// ================================
router.get("/:id", authenticateToken, authorizeRoles("admin", "staff"), async (req, res) => {
  try {
    const { id } = req.params;
    const db = await dbPromise;
    const [[txn]] = await db.query(`
      SELECT t.id, t.reference_id, t.type, t.amount, t.payment_method, t.status, t.created_at,
             t.related_id AS booking_id,
             u.id AS user_id, u.name AS customer
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `, [id]);

    if (!txn) return res.status(404).json({ message: "Transaction not found" });
    res.json(txn);
  } catch (err) {
    console.error("❌ Error fetching transaction:", err);
    res.status(500).json({ message: "Error fetching transaction" });
  }
});

module.exports = router;
