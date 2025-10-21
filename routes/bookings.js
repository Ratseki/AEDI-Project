// routes/bookings.js
const express = require("express");
const db = require("../config/db"); // your DB connection
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// ============================
// 🧾 Get all bookings for logged-in user
// ============================
router.get("/", authenticateToken, (req, res) => {
  const userId = req.user.id; // comes from JWT

  db.query(
    "SELECT * FROM bookings WHERE user_id = ? ORDER BY date DESC",
    [userId],
    (err, results) => {
      if (err) {
        console.error("❌ Error fetching bookings:", err);
        return res.status(500).json({ message: "Server error" });
      }
      res.json(results);
    }
  );
});

// ============================
// 📅 Create a new booking
// ============================
router.post("/", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const {
    service_id,      // ✅ ADD THIS LINE
    first_name,
    last_name,
    email,
    phone_area,
    phone_number,
    date,
    time,
    package_name,
    note,
    num_people
  } = req.body;

  db.query(
    `INSERT INTO bookings 
    (user_id, service_id, first_name, last_name, email, phone_area, phone_number, date, time, package_name, note, num_people, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      userId,
      service_id, // ✅ make sure this is passed correctly from frontend
      first_name,
      last_name,
      email,
      phone_area,
      phone_number,
      date,
      time,
      package_name,
      note,
      num_people
    ],
    (err) => {
      if (err) {
        console.error("❌ Error creating booking:", err);
        return res.status(500).json({ message: "Failed to create booking" });
      }
      res.json({ message: "✅ Booking created successfully!" });
    }
  );
});


// ============================
// ❌ Cancel booking
// ============================
router.delete("/cancel-booking/:id", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const bookingId = req.params.id;

  db.query(
    "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND user_id = ?",
    [bookingId, userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Failed to cancel booking" });
      if (result.affectedRows === 0)
        return res.status(403).json({ message: "Unauthorized or booking not found" });
      res.json({ message: "❌ Booking cancelled successfully" });
    }
  );
});

module.exports = router;
