// routes/cancellations.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Cancel a booking
router.put("/:booking_id/cancel", (req, res) => {
  const { reason } = req.body;

  db.query(
    "UPDATE bookings SET status = 'cancelled', cancel_reason = ? WHERE id = ?",
    [reason || null, req.params.booking_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Booking not found" });
      res.json({ message: "Booking cancelled successfully" });
    }
  );
});

module.exports = router;
