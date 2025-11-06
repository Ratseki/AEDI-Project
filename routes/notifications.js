const express = require("express");
const router = express.Router();
const { dbPromise } = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

// === Get all notifications for the logged-in user ===
router.get("/", authenticateToken, async (req, res) => {
  try {
    const [rows] = await dbPromise.query(
      "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error loading notifications" });
  }
});

// === Mark notification as read ===
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    await dbPromise.query("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?", [
      req.params.id,
      req.user.id,
    ]);
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating notification" });
  }
});

// === Admin or System can push notifications (optional) ===
router.post("/send", authenticateToken, async (req, res) => {
  const { user_id, title, message, type } = req.body;
  if (!user_id || !title || !message)
    return res.status(400).json({ message: "Missing fields" });

  try {
    await dbPromise.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
      [user_id, title, message, type || "info"]
    );
    res.json({ message: "Notification sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending notification" });
  }
});

module.exports = router;
