// middleware/adminMiddleware.js
module.exports = function verifyAdmin(req, res, next) {
  if (!req.user || !req.user.role) return res.status(403).json({ message: "Unauthorized" });
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
  next();
};
