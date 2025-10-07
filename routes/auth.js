const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");

const router = express.Router();

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "multimedia_booking"
});

// Secret key for JWT
const JWT_SECRET = "supersecretkey";

// User Registration
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  const hashed = bcrypt.hashSync(password, 10);

  db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, hashed],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "User registered successfully" });
    });
});

// User Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(401).json({ message: "User not found" });

    const user = results[0];
    const isValid = bcrypt.compareSync(password, user.password);

    if (!isValid) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "2h" });
    res.json({ message: "Login successful", token });
  });
});

module.exports = router;
