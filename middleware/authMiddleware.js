const jwt = require("jsonwebtoken");
const JWT_SECRET = "supersecretkey"; // same as your auth.js key

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token." });

    req.user = user; // attach decoded user info to request
    next();
  });
}

module.exports = authenticateToken;
