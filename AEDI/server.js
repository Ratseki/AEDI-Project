const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "multimedia_booking"
});

db.connect(err => {
  if (err) throw err;
  console.log("✅ MySQL Connected");
});

// Secret key for JWT
const JWT_SECRET = "supersecretkey";


// ======================= PAYMENTS =======================

app.post("/payments", (req, res) => {
  const { booking_id, amount, status } = req.body;
  db.query(
    "INSERT INTO payments (booking_id, amount, status) VALUES (?, ?, ?)",
    [booking_id, amount, status || 'pending'],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Payment recorded successfully", payment_id: result.insertId });
    }
  );
});

app.put("/payments/:id", (req, res) => {
  const { status } = req.body;
  db.query(
    "UPDATE payments SET status=? WHERE id=?",
    [status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Payment status updated" });
    }
  );
});


// ======================= NOTIFICATIONS =======================

app.post("/notifications", (req, res) => {
  const { user_id, message } = req.body;
  db.query(
    "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
    [user_id, message],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Notification sent", notification_id: result.insertId });
    }
  );
});

app.get("/notifications/:user_id", (req, res) => {
  db.query(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
    [req.params.user_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    }
  );
});

app.put("/notifications/:id/read", (req, res) => {
  db.query(
    "UPDATE notifications SET is_read = TRUE WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Notification marked as read" });
    }
  );
});


// ======================= REVIEWS =======================

app.post("/reviews", (req, res) => {
  const { user_id, service_id, rating, comment } = req.body;
  db.query(
    "INSERT INTO reviews (user_id, service_id, rating, comment) VALUES (?, ?, ?, ?)",
    [user_id, service_id, rating, comment],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Review submitted", review_id: result.insertId });
    }
  );
});

app.get("/reviews/service/:service_id", (req, res) => {
  db.query(
    "SELECT r.*, u.name AS user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.service_id = ? ORDER BY r.created_at DESC",
    [req.params.service_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      res.json(results);
    }
  );
});


// ✅ Start the server LAST
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
