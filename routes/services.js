const express = require("express");
const mysql = require("mysql2");

const router = express.Router();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "multimedia_booking"
});

// ✅ Get all services
router.get("/", (req, res) => {
  db.query("SELECT * FROM services", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// ✅ Add a new service (optional)
router.post("/", (req, res) => {
  const { name, description, price } = req.body;
  db.query(
    "INSERT INTO services (name, description, price) VALUES (?, ?, ?)",
    [name, description, price],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Service added successfully", service_id: result.insertId });
    }
  );
});

module.exports = router;
