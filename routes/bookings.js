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
 * GET /api/bookings/admin/summary/:id
 * ✅ NEW: Admin-only route to get summary for *any* booking.
 * This route does NOT check for user ownership.
 */
router.get(
  "/admin/summary/:id",
  authenticateToken,
  authorizeRoles("admin", "staff"),
  async (req, res) => {
    try {
      const bookingId = req.params.id; // No user_id check

      // This query joins user info for display
      const [rows] = await dbPromise.query(
        `SELECT b.*, s.name AS service_name, s.price AS service_price,
                u.name AS customer_name, u.email AS customer_email
         FROM bookings b
         LEFT JOIN services s ON b.service_id = s.id
         LEFT JOIN users u ON b.user_id = u.id
         WHERE b.id = ? LIMIT 1`,
        [bookingId]
      );

      if (!rows.length)
        return res.status(404).json({ message: "Booking not found" });

      const booking = rows[0];
      const subtotal = parseFloat(booking.service_price || 0);
      const tax = +(subtotal * TAX_RATE).toFixed(2);
      const total = +(subtotal + tax).toFixed(2);

      const summary = {
        subtotal,
        tax,
        tax_rate: TAX_RATE,
        total,
        notice: `Total includes ${Math.round(
          TAX_RATE * 100
        )}% tax. Package + Tax = Total.`,
      };

      return res.json({ booking, summary });
    } catch (err) {
      console.error("Error fetching admin booking summary:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * GET /api/bookings/admin/payment-details/:id
 * ✅ NEW: Smart route for the admin dashboard to get balance info.
 */
router.get(
  "/admin/payment-details/:id",
  authenticateToken,
  authorizeRoles("admin", "staff"),
  async (req, res) => {
    try {
      const bookingId = req.params.id;
      const db = await dbPromise;

      // 1. Get the total price of the service
      const [[booking]] = await db.query(
        `SELECT s.price 
         FROM bookings b
         LEFT JOIN services s ON b.service_id = s.id
         WHERE b.id = ?`,
        [bookingId]
      );

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const total_price = Number(booking.price || 0);

      // 2. Get the sum of all confirmed payments for this booking
      const [[payment]] = await db.query(
        `SELECT SUM(amount) AS total_paid 
         FROM transactions 
         WHERE related_id = ? AND type = 'booking' AND status = 'confirmed'`,
        [bookingId]
      );
      
      const total_paid = Number(payment.total_paid || 0);
      const remaining_balance = total_price - total_paid;

      res.json({
        total_price,
        total_paid,
        remaining_balance: remaining_balance < 0 ? 0 : remaining_balance, // Don't show negative
      });

    } catch (err) {
      console.error("Error fetching payment details:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

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
 * POST /api/bookings/:id/pay (SMARTER VERSION)
 * Records payment and automatically updates booking status based on remaining balance.
 */
router.post("/:id/pay", authenticateToken, async (req, res) => {
  const bookingId = req.params.id;
  const { amount, payment_method = "unknown", reference = null } = req.body;

  if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid payment amount" });

  const conn = await dbPromise.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Get booking and total price
    const [[booking]] = await conn.query(
      `SELECT b.user_id, s.price 
       FROM bookings b
       LEFT JOIN services s ON b.service_id = s.id
       WHERE b.id = ? LIMIT 1`,
      [bookingId]
    );
    if (!booking) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: "Booking not found" });
    }
    const total_price = Number(booking.price || 0);

    // 2. Get total already paid
    const [[payment]] = await conn.query(
      `SELECT SUM(amount) AS total_paid 
       FROM transactions 
       WHERE related_id = ? AND type = 'booking' AND status = 'confirmed'`,
      [bookingId]
    );
    const total_paid = Number(payment.total_paid || 0);

    // 3. Create transaction reflection
    const ref = reference || `BOOKING-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    await conn.query(
      `INSERT INTO transactions
        (user_id, reference_id, type, related_id, amount, payment_method, status, created_at)
        VALUES (?, ?, 'booking', ?, ?, ?, 'confirmed', NOW())`,
      [booking.user_id, ref, bookingId, amount, payment_method]
    );

    // 4. Determine new status
    const new_total_paid = total_paid + Number(amount);
    let new_status = 'partial';
    if (new_total_paid >= total_price) {
      new_status = 'paid'; // Set to 'paid' if full amount is covered
    }
    
    // Update booking status
    await conn.query("UPDATE bookings SET status = ? WHERE id = ?", [new_status, bookingId]);

    // NOTE: We don't need to insert into the 'payments' table anymore
    // because the 'transactions' table is our single source of truth for payments.
    // This simplifies the logic immensely.

    await conn.commit();
    conn.release();

    return res.json({ message: "Payment recorded and transaction created", reference: ref });
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
 * Customer adds feedback/review (NOW LINKED TO BOOKING_ID)
 */
router.post("/:id/review", authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.id; // This is the booking_id
    const userId = req.user.id;
    const { rating = 5, comment = "" } = req.body;

    // fetch booking to ensure ownership and service_id
    const [bRows] = await dbPromise.query("SELECT user_id, service_id FROM bookings WHERE id = ? LIMIT 1", [bookingId]);
    if (!bRows.length) return res.status(404).json({ message: "Booking not found" });
    if (bRows[0].user_id !== userId) return res.status(403).json({ message: "Not authorized to review this booking" });

    const service_id = bRows[0].service_id || null;

    // ✅ FIX: Insert into reviews table WITH the booking_id
    await dbPromise.query(
      "INSERT INTO reviews (user_id, service_id, booking_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [userId, service_id, bookingId, rating, comment]
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
