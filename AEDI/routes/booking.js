// Check availability
app.post("/check-availability", (req, res) => {
  const { service_id, date } = req.body;

  db.query("SELECT * FROM bookings WHERE service_id = ? AND date = ?", [service_id, date], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length > 0) {
      res.json({ available: false, message: "Slot already booked" });
    } else {
      res.json({ available: true, message: "Slot available" });
    }
  });
});

// Create booking
app.post("/book", (req, res) => {
  const { user_id, service_id, date } = req.body;

  // First check if available
  db.query("SELECT * FROM bookings WHERE service_id = ? AND date = ?", [service_id, date], (err, results) => {
    if (results.length > 0) return res.json({ error: "Date already booked" });

    db.query("INSERT INTO bookings (user_id, service_id, date) VALUES (?, ?, ?)",
      [user_id, service_id, date],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Booking successful!" });
      }
    );
  });
});
