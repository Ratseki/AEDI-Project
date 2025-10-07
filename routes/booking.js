const express = require("express");
const mysql = require("mysql2");
const authenticateToken = require("../middleware/authMiddleware"); // ✅ Import middleware

const router = express.Router();

const db = mysql.createConnection({ 
  host: "localhost",
  user: "root",
  password: "",
  database: "multimedia_booking"
});

// ✅ Create booking (protected)
router.post("/", authenticateToken, (req, res) => {
  const { service_id, date, time } = req.body;
  const user_id = req.user.id; // ✅ get from JWT, not body

  db.query(
    "INSERT INTO bookings (user_id, service_id, date, time, status) VALUES (?, ?, ?, ?, 'pending')",
    [user_id, service_id, date, time],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Booking created successfully", booking_id: result.insertId });
    }
  );
});

// ✅ Get all bookings (admin only — optional)
router.get("/", (req, res) => {
  db.query("SELECT * FROM bookings", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// ✅ Update booking status (admin/staff)
router.put("/:id/status", authenticateToken, (req, res) => {
  const { status } = req.body;
  db.query("UPDATE bookings SET status=? WHERE id=?", [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Booking status updated" });
  });
});

// ✅ Cancel booking (user only)
router.delete("/cancel-booking/:id", authenticateToken, (req, res) => {
  const bookingId = req.params.id;
  const userId = req.user.id;

  // ✅ ensure user only deletes their own booking
  db.query("DELETE FROM bookings WHERE id = ? AND user_id = ?", [bookingId, userId], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Booking not found or unauthorized." });

    res.json({ message: "Booking canceled successfully." });
  });
});

// ✅ Booking history (protected)
router.get("/booking-history", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT b.id, s.name AS service_name, b.date, b.status
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.user_id = ?
    ORDER BY b.date DESC
  `;
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

module.exports = router;
