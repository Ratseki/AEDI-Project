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
      SELECT t.id, u.name AS user_name, t.reference_id, t.type, t.amount,
             t.payment_method, t.status, t.created_at
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);

    // ✅ Always return an array to prevent frontend "reduce is not a function" errors
    res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error("❌ Error fetching transactions:", err);
    // ✅ Also return an empty array on error
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

    if (!["confirmed", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const db = await dbPromise;
    const [result] = await db.query("UPDATE transactions SET status = ? WHERE id = ?", [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: `Transaction ${status} successfully.` });
  } catch (err) {
    console.error("❌ Error updating transaction status:", err);
    res.status(500).json({ message: "Error updating transaction status" });
  }
});

module.exports = router;
