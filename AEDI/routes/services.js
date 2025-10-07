// List all services
app.get("/services", (req, res) => {
  db.query("SELECT * FROM services", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Add a service (Admin only - simplified)
app.post("/services", (req, res) => {
  const { name, description, price } = req.body;
  db.query("INSERT INTO services (name, description, price) VALUES (?, ?, ?)",
    [name, description, price],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Service added successfully" });
    }
  );
});
