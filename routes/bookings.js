// routes/bookings.js
// Upgraded booking endpoints: summary with tax, approval, payment, reviews, and user/admin history reflection.

const express = require("express");
const { db, dbPromise } = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();
const TAX_RATE = parseFloat(process.env.BOOKING_TAX_RATE || "0.12"); // default 12%

/**
 * GET /api/bookings/summary/:id
 * Return booking details + computed price summary (subtotal, tax, total, notice)
 */
router.get("/summary/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;

    // Join with services table if available to get price info
    const [rows] = await dbPromise.query(
      `SELECT b.*, s.name AS service_name, s.price AS service_price
       FROM bookings b
       LEFT JOIN services s ON b.service_id = s.id
       WHERE b.id = ? AND b.user_id = ? LIMIT 1`,
      [bookingId, userId]
    );

    if (!rows.length) return res.status(404).json({ message: "Booking not found" });

    const booking = rows[0];
    const subtotal = parseFloat(booking.service_price || 0);
    const tax = +(subtotal * TAX_RATE).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);

    const summary = {
      subtotal,
      tax,
      tax_rate: TAX_RATE,
      total,
      notice: `Total includes ${Math.round(TAX_RATE * 100)}% tax. Package + Tax = Total.`,
    };

    return res.json({ booking, summary });
  } catch (err) {
    console.error("Error fetching booking summary:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/bookings/:id
 * Return booking (existing), but updated to use promise pool
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = req.params.id;
    const [rows] = await dbPromise.query("SELECT * FROM bookings WHERE id = ? AND user_id = ? LIMIT 1", [bookingId, userId]);
    if (!rows.length) return res.status(404).json({ message: "Booking not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/bookings
 * Get all bookings for logged-in user
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await dbPromise.query("SELECT * FROM bookings WHERE user_id = ? ORDER BY date DESC", [userId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/bookings
 * Create a new booking
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      service_id,
      first_name,
      last_name,
      email,
      phone_area,
      phone_number,
      date,
      time,
      package_name,
      note,
      num_people,
      location
    } = req.body;

    const sql = `
      INSERT INTO bookings 
      (user_id, service_id, first_name, last_name, email, phone_area, phone_number, date, time, package_name, note, num_people, location, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    const [result] = await dbPromise.query(sql, [
      userId,
      service_id,
      first_name,
      last_name,
      email,
      phone_area,
      phone_number,
      date,
      time,
      package_name,
      note,
      num_people || 1,
      location || null
    ]);

    // ✅ You CANNOT put dbPromise queries outside a route
    // Payment / transaction creation must be in a separate route
    // e.g., POST /api/bookings/:id/pay

    return res.json({ message: "✅ Booking created successfully!", booking_id: result.insertId });
  } catch (err) {
    console.error("Error creating booking:", err);
    return res.status(500).json({ message: "Failed to create booking" });
  }
});

/**
 * POST /api/bookings/:id/pay
 * Record payment (downpayment or full) for a booking.
 * This will insert into payments and create a transaction for reflection in admin/user history.
 */
router.post("/:id/pay", authenticateToken, async (req, res) => {
  const bookingId = req.params.id;
  const userId = req.user.id;
  const { amount, is_downpayment = true, payment_method = "unknown", reference = null } = req.body;

  if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid payment amount" });

  const conn = await dbPromise.getConnection();
  try {
    await conn.beginTransaction();

    // verify booking ownership (user can pay) or staff/admin can pay for any booking
    const [bookingRows] = await conn.query("SELECT * FROM bookings WHERE id = ? LIMIT 1", [bookingId]);
    if (!bookingRows.length) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: "Booking not found" });
    }
    const booking = bookingRows[0];

    // If user is not the owner and not staff/admin -> forbidden
    if (req.user.role === "customer" && booking.user_id !== userId) {
      await conn.rollback();
      conn.release();
      return res.status(403).json({ message: "Not authorized to pay for this booking" });
    }

    // Insert payment record
    const [payResult] = await conn.query(
      "INSERT INTO payments (booking_id, amount, status, created_at, is_downpayment) VALUES (?, ?, ?, NOW(), ?)",
      [bookingId, amount, is_downpayment ? 'downpayment' : 'full', is_downpayment ? 1 : 0]
    );

    // Create transaction reflection
    const ref = reference || `BOOKING-${Math.random().toString(36).substring(2,9).toUpperCase()}`;
    await conn.query(
      `INSERT INTO transactions
       (user_id, reference_id, type, related_id, amount, payment_method, status, created_at)
       VALUES (?, ?, 'booking', ?, ?, ?, 'confirmed', NOW())`,
      [booking.user_id, ref, bookingId, amount, payment_method]
    );

    // Optionally update booking status: if full payment then 'paid', if downpayment mark 'partial'
    if (!is_downpayment) {
      await conn.query("UPDATE bookings SET status = 'paid' WHERE id = ?", [bookingId]);
    } else {
      await conn.query("UPDATE bookings SET status = 'partial' WHERE id = ?", [bookingId]);
    }

    await conn.commit();
    conn.release();

    return res.json({ message: "Payment recorded and transaction created", payment_id: payResult.insertId, reference: ref });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error("Error recording payment:", err);
    return res.status(500).json({ message: "Failed to record payment" });
  }
});

/**
 * PUT /api/bookings/:id/approve
 * Staff/Admin endpoint to approve or update booking status.
 */
// Merge approval endpoints:
router.put("/:id/approve", authenticateToken, authorizeRoles("staff", "admin"), async (req,res) => {
  const bookingId = req.params.id;
  const { status } = req.body;
  const allowed = ["confirmed","cancelled","pending","paid","partial"];
  if(!allowed.includes(status)) return res.status(400).json({message:"Invalid status"});
  const [result] = await dbPromise.query("UPDATE bookings SET status=? WHERE id=?",[status,bookingId]);
  if(result.affectedRows===0) return res.status(404).json({message:"Booking not found"});
  // Optional: trigger notification to user
  res.json({message:`Booking status updated to ${status}`});
});

/**
 * POST /api/bookings/:id/review
 * Customer adds feedback/review for a booking (rating + comment)
 * Reviews will be visible to admin via /api/admin/reviews or via transactions join.
 */
router.post("/:id/review", authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const { rating = null, comment = "" } = req.body;

    // fetch booking to ensure ownership and service_id
    const [bRows] = await dbPromise.query("SELECT user_id, service_id FROM bookings WHERE id = ? LIMIT 1", [bookingId]);
    if (!bRows.length) return res.status(404).json({ message: "Booking not found" });
    if (bRows[0].user_id !== userId) return res.status(403).json({ message: "Not authorized to review this booking" });

    const service_id = bRows[0].service_id || null;

    // Insert into reviews table
    await dbPromise.query(
      "INSERT INTO reviews (user_id, service_id, rating, comment, created_at) VALUES (?, ?, ?, ?, NOW())",
      [userId, service_id, rating, comment]
    );

    return res.json({ message: "Review submitted. Thanks for the feedback!" });
  } catch (err) {
    console.error("Error submitting review:", err);
    return res.status(500).json({ message: "Failed to submit review" });
  }
});

/**
 * GET /api/bookings/history
 * Return booking + transaction history for logged-in user (reflects bookings + payments)
 */
router.get("/history/all", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // bookings
    const [bookings] = await dbPromise.query("SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC", [userId]);

    // transactions for this user (both photo and booking)
    const [transactions] = await dbPromise.query("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC", [userId]);

    return res.json({ bookings, transactions });
  } catch (err) {
    console.error("Error fetching history:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Admin: Get all reviews (for admin dashboard)
 */
router.get("/admin/reviews", authenticateToken, authorizeRoles("admin", "staff"), async (req, res) => {
  try {
    const [rows] = await dbPromise.query(`
      SELECT r.*, u.name AS user_name, s.name AS service_name
      FROM reviews r
      LEFT JOIN users u ON u.id = r.user_id
      LEFT JOIN services s ON s.id = r.service_id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/status/:id", authenticateToken, authorizeRoles("admin","staff"), async (req,res) => {
  const { status } = req.body; // confirmed / cancelled
  const bookingId = req.params.id;
  try {
    const [result] = await dbPromise.query(
      "UPDATE bookings SET status=? WHERE id=?",
      [status, bookingId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Booking not found" });
    res.json({ message: `Booking ${status}` });
  } catch(err){
    res.status(500).json({ message: "Error updating booking status" });
  }
});


module.exports = router;
