// routes/bookings.js
const express = require("express");
const { db } = require("../config/db"); // your DB connection
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// ============================
// 🧾 Get all bookings for logged-in user
// ============================
// Get single booking by ID
router.get("/:id", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const bookingId = req.params.id;

  db.query(
    "SELECT * FROM bookings WHERE id = ? AND user_id = ?",
    [bookingId, userId],
    (err, results) => {
      if (err) {
        console.error("❌ Error fetching booking:", err);
        return res.status(500).json({ message: "Server error" });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(results[0]);
    }
  );
});

// Get all bookings for logged in user
router.get("/", authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query("SELECT * FROM bookings WHERE user_id = ? ORDER BY date DESC", [userId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching user bookings:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json(results);
  });
});

// ============================
// 📅 Create a new booking
// ============================
router.post("/", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const {
    service_id,
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

  const sql = `
    INSERT INTO bookings 
    (user_id, service_id, first_name, last_name, email, phone_area, phone_number, date, time, package_name, note, num_people, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  db.query(sql, [
    userId,
    service_id,
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
  ], (err, result) => {
    if (err) {
      console.error("❌ Error creating booking:", err);
      return res.status(500).json({ message: "Failed to create booking" });
    }

    // ✅ Return the inserted booking ID
    res.json({
      message: "✅ Booking created successfully!",
      booking_id: result.insertId
    });
  });
});

// ============================
// 💳 Downpayment Route
// ============================
router.post("/downpayment", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { booking_id, amount } = req.body;

  if (!booking_id || !amount) {
    return res.status(400).json({ error: "Missing booking ID or amount" });
  }

  // Verify booking belongs to the user
  db.query(
    "SELECT * FROM bookings WHERE id = ? AND user_id = ?",
    [booking_id, userId],
    (err, results) => {
      if (err) {
        console.error("❌ Error verifying booking:", err);
        return res.status(500).json({ error: "Server error" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Booking not found or unauthorized" });
      }

      // Simulate payment processing (this is where PayMongo will integrate)
      const paymentStatus = "success"; // you’ll replace this with actual API response

      // Record payment in the database
      db.query(
        "INSERT INTO payments (booking_id, user_id, amount, status) VALUES (?, ?, ?, ?)",
        [booking_id, userId, amount, paymentStatus],
        (err, result) => {
          if (err) {
            console.error("❌ Error recording payment:", err);
            return res.status(500).json({ error: "Failed to record payment" });
          }

          // Update booking status if needed
          db.query(
            "UPDATE bookings SET status = 'paid' WHERE id = ?",
            [booking_id],
            (err2) => {
              if (err2) {
                console.error("❌ Error updating booking status:", err2);
              }
              res.json({
                message: "✅ Downpayment recorded successfully!",
                payment_id: result.insertId,
              });
            }
          );
        }
      );
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
