require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const cron = require("node-cron");

// === Middleware + JWT ===
const authenticateToken = require("./middleware/authMiddleware");

const app = express();

// === Middleware ===
app.use(cors({ origin: "http://127.0.0.1:5500" })); // frontend address
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // serve uploaded photos

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

// Export db as promise for async/await
const dbPromise = db.promise();

// === JWT Secret Debug ===
console.log("🔐 JWT_SECRET loaded:", process.env.JWT_SECRET);
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// === Route Imports ===
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/bookings");
const serviceRoutes = require("./routes/services");
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/payments");
const cancellationRoutes = require("./routes/cancellations");
const analyticsRoutes = require("./routes/analytics");
const bookingExtrasRoutes = require("./routes/bookings_extras");

// === Photo Routes ===
const photoRoutes = require("./routes/photos"); // upload + gallery
const photoPurchaseRoutes = require("./routes/photoPurchases"); // purchase/download

// ======================================================
// ✅ Route Mounting
// ======================================================
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/cancellations", cancellationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/bookings_extras", bookingExtrasRoutes);
app.use("/api/admin", adminRoutes);

// Photo-related routes
app.use("/api/photos", photoRoutes); // upload + gallery
app.use("/api/photo-purchases", photoPurchaseRoutes); // purchase + download

// ======================================================
// === Cron Job: Expire Purchased Photos ===
cron.schedule("0 0 * * *", async () => {
  try {
    await dbPromise.query(
      "UPDATE photos SET status='expired' WHERE status='purchased' AND expires_at < NOW()"
    );
    console.log("🕒 Expired photo access cleaned up.");
  } catch (err) {
    console.error("❌ Cron error:", err);
  }
});

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

// Export dbPromise for route files
module.exports = { db, dbPromise };
