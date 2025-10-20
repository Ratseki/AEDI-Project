require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

// === Middleware + JWT ===
const authenticateToken = require("./middleware/authMiddleware");

const app = express();

// === Middleware ===
app.use(cors({ origin: "http://127.0.0.1:5500" })); // frontend address (adjust if needed)
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// === Database Connection ===
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "multimedia_booking",
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ MySQL Connected");
});

// === JWT Secret Debug ===
console.log("🔐 JWT_SECRET loaded:", process.env.JWT_SECRET);

// === JWT Secret (from .env) ===
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// === Route Imports ===
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/booking");
const serviceRoutes = require("./routes/services");
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/payments");
const cancellationRoutes = require("./routes/cancellations");
const analyticsRoutes = require("./routes/analytics");
const bookingExtrasRoutes = require("./routes/bookings_extras");

// ======================================================
// ✅ #3 — Route Mounting
// ======================================================

// --- Public Routes ---
app.use("/api/auth", authRoutes);          // Register / Login / Profile
app.use("/api/services", serviceRoutes);   // Public service list

// --- Protected Routes (JWT Required) ---
app.use("/api/bookings", authenticateToken, bookingRoutes); 
app.use("/api/payments", authenticateToken, paymentRoutes);
app.use("/api/cancellations", authenticateToken, cancellationRoutes);
app.use("/api/analytics", authenticateToken, analyticsRoutes);
app.use("/api/bookings_extras", authenticateToken, bookingExtrasRoutes);
app.use("/api/admin", authenticateToken, adminRoutes);

// ======================================================
// === 404 Fallback ===
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// === Start Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
