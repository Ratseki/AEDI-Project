// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

function authenticateToken(req, res, next) {
  // ✅ Check both cookies and Authorization header
  const authHeader = req.headers["authorization"];
  const token =
    req.cookies?.token ||
    (authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

  if (!token) return res.status(401).json({ message: "Access denied, token missing" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
