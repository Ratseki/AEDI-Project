// Cancel Booking (#4)
app.delete("/cancel-booking/:id", (req, res) => {
  const bookingId = req.params.id;

  db.query("DELETE FROM bookings WHERE id = ?", [bookingId], (err, result) => {
    if (err) return res.status(500).json({ error: err });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Booking canceled successfully." });
  });
});

// View Booking History (#5)
app.get("/booking-history/:user_id", (req, res) => {
  const userId = req.params.user_id;

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