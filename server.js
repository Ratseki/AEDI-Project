require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const cron = require("node-cron");
const cookieParser = require("cookie-parser");

// === Database (Single Source of Truth) ===
const { db, dbPromise } = require("./config/db");

// === Middleware + JWT ===
const authenticateToken = require("./middleware/authMiddleware");
const authorizeRoles = require("./middleware/roleMiddleware");

const app = express();

// ======================================================
// === Middleware
// ======================================================
app.use(cors({
  origin: "http://localhost:3000", // Node server origin
  credentials: true
}));
 // frontend address
app.use(express.json());
app.use(bodyParser.json());
// Serve everything in public
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/webhooks", require("./routes/webhooks"));

// Optional: explicitly serve /user if needed
app.use("/user", express.static(path.join(__dirname, "public/user")));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // serve uploaded photos
app.use(cookieParser());

// ======================================================
// === JWT Secret Debug
// ======================================================
console.log("🔐 JWT_SECRET loaded:", process.env.JWT_SECRET || "supersecretkey");

// ======================================================
// === Route Imports
// ======================================================
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/bookings");
const serviceRoutes = require("./routes/services");
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/payments");
const cancellationRoutes = require("./routes/cancellations");
const analyticsRoutes = require("./routes/analytics");
const bookingExtrasRoutes = require("./routes/bookings_extras");
const qrRoutes = require("./routes/qr");
const galleryAccessRoutes = require("./routes/galleryAccess");
const photoRoutes = require("./routes/photos"); // upload + gallery
const photoPurchaseRoutes = require("./routes/photoPurchases"); // purchase + download

// ======================================================
// === Route Mounting
// ======================================================
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/cancellations", cancellationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/bookings_extras", bookingExtrasRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/gallery", galleryAccessRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/photo-purchases", photoPurchaseRoutes);

// ======================================================
// === Cron Job: Expire Purchased Photos
// ======================================================
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
// === Serve Staff Login Page (static from /public)
// ======================================================
app.get("/staff/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

// ======================================================
// === Protected Staff Dashboard Route (Final Version)
// ======================================================
app.get(
  "/staff/dashboard-secure",
  authenticateToken,
  authorizeRoles("staff", "admin"),
  (req, res) => {
    console.log("✅ Authorized access by:", req.user.email, "Role:", req.user.role);
    res.sendFile(path.join(__dirname, "views/staff/dashboard.html"));
  }
);

// Protected User Gallery
app.get('/user/gallery', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/user/user_gallery.html'));
});

// Redirect manual access of user_gallery.html to protected gallery route
app.get('/user/user_gallery.html', (req, res) => {
  res.redirect('/user/gallery');
});


// ======================================================
// === 404 Fallback
// ======================================================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ======================================================
// === Start Server
// ======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
