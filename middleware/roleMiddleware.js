// middleware/roleMiddleware.js
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn(`Access denied for ${req.user.email} (role: ${req.user.role})`);
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }

    next();
  };
}

module.exports = authorizeRoles;
