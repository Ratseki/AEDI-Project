// routes/bookings.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware'); // uses same JWT secret
const db = require('../models/User'); // <-- your project uses this for mysql connection (adjust path if different)
const bcrypt = require('bcrypt');

// === Create booking (protected)
router.post('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const {
    first_name, last_name, email, phone_area, phone_number,
    date, time, location, package: pkg, note, num_people
  } = req.body;

  if (!date || !time || !location || !pkg)
    return res.status(400).json({ message: 'Missing required booking fields' });

  const query = `INSERT INTO bookings
    (user_id, first_name, last_name, email, phone_area, phone_number, date, time, location, package_name, note, num_people, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [userId, first_name, last_name, email, phone_area, phone_number, date, time, location, pkg, note || '', num_people || 1, 'pending'];

  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Create booking error:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.json({ message: 'Booking created', booking_id: result.insertId });
  });
});

// === Record downpayment (protected)
router.post('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const {
    first_name, last_name, email, phone_area, phone_number,
    date, time, location, package: pkg, note, num_people, service_id
  } = req.body;

  if (!date || !time || !location || !pkg || !service_id)
    return res.status(400).json({ message: 'Missing required booking fields' });

  const query = `INSERT INTO bookings
    (user_id, first_name, last_name, email, phone_area, phone_number, date, time, location, package_name, note, num_people, status, service_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [userId, first_name, last_name, email, phone_area, phone_number,
                  date, time, location, pkg, note || '', num_people || 1, 'pending', service_id];

  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Create booking error:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.json({ message: 'Booking created', booking_id: result.insertId });
  });
});


// === Cancel booking (protected)
router.put('/cancel/:id', authenticateToken, (req, res) => {
  const bookingId = req.params.id;
  const userId = req.user.id;

  db.query('SELECT user_id FROM bookings WHERE id = ?', [bookingId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' });
    if (rows[0].user_id !== userId) return res.status(403).json({ message: 'Unauthorized' });

    db.query('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', bookingId], (err2) => {
      if (err2) return res.status(500).json({ message: 'Database error', error: err2 });
      res.json({ message: 'Booking cancelled' });
    });
  });
});

// === Admin: list bookings
router.get('/', (req, res) => {
  db.query(
    'SELECT b.*, u.name AS client_name FROM bookings b LEFT JOIN users u ON b.user_id = u.id ORDER BY b.id DESC',
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      res.json(rows);
    }
  );
});

// === User bookings (protected)
router.get('/mine', authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query('SELECT * FROM bookings WHERE user_id = ? ORDER BY date DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    res.json(rows);
  });
});

module.exports = router;
